import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/config/env.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/state/auth_provider.dart';
import '../data/tracking_repository.dart';

// Per-kind accents. Distinct so 20 pins read at a glance; still palette-friendly
// (green shuttle, amber cab, teal keke — no dashboard blue).
const Color _shuttleColor = AppColors.brand600;
const Color _cabColor = AppColors.warning;
const Color _kekeColor = Color(0xFF0F766E);

/// (icon, colour, label) for a vehicle_type. Backend enum: bus | cab | tricycle.
(IconData, Color, String) _styleFor(String type) {
  switch (type) {
    case 'cab':
      return (Icons.local_taxi_rounded, _cabColor, 'Cab');
    case 'tricycle':
      return (Icons.electric_rickshaw, _kekeColor, 'Keke');
    case 'bus':
    default:
      return (Icons.directions_bus_rounded, _shuttleColor, 'Shuttle');
  }
}

/// Socket payload from the backend `location:update` event.
class LocationUpdate {
  final String tripId;
  final double latitude;
  final double longitude;

  LocationUpdate({
    required this.tripId,
    required this.latitude,
    required this.longitude,
  });

  LatLng get latLng => LatLng(latitude, longitude);

  factory LocationUpdate.fromJson(Map<String, dynamic> json) {
    double toD(dynamic v) =>
        v is num ? v.toDouble() : double.tryParse('$v') ?? 0;
    return LocationUpdate(
      tripId: json['trip_id'] as String,
      latitude: toD(json['latitude']),
      longitude: toD(json['longitude']),
    );
  }
}

/// One tracked vehicle: its metadata plus a smoothly-interpolated position. All
/// vehicles share a single ticker; each stores a from→to segment with a start
/// time so its marker glides between GPS pings instead of teleporting.
class _VehicleTrack {
  _VehicleTrack({
    required this.meta,
    required LatLng position,
    required this.lastUpdateAt,
  })  : _from = position,
        _to = position,
        _start = DateTime.now(),
        _dur = const Duration(milliseconds: 1);

  ActiveTrip meta;
  LatLng _from;
  LatLng _to;
  DateTime _start;
  Duration _dur;
  DateTime lastUpdateAt;

  LatLng get target => _to;

  LatLng positionAt(DateTime now) {
    final ms = _dur.inMilliseconds;
    if (ms <= 0) return _to;
    final raw = (now.difference(_start).inMilliseconds / ms).clamp(0.0, 1.0);
    final t = Curves.easeInOut.transform(raw);
    return LatLng(
      _from.latitude + (_to.latitude - _from.latitude) * t,
      _from.longitude + (_to.longitude - _from.longitude) * t,
    );
  }

  void moveTo(LatLng destination, DateTime now) {
    _from = positionAt(now);
    _to = destination;
    _start = now;
    _dur = const Duration(milliseconds: 900);
    lastUpdateAt = now;
  }
}

/// Campus live map: shows **every active vehicle** on campus at once. The map is
/// for *reading* — pan/zoom freely; tapping a vehicle opens an info panel for it,
/// tapping the map dismisses it. Positions stream over Socket.io; the roster is
/// seeded and reconciled from `GET /tracking/active`.
class LiveMapScreen extends StatefulWidget {
  final String socketUrl;

  LiveMapScreen({super.key, String? socketUrl})
      : socketUrl = socketUrl ?? Env.socketUrl;

  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen>
    with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  final TrackingRepository _repo = TrackingRepository();

  late io.Socket _socket;
  final Map<String, _VehicleTrack> _tracks = {};

  // Trips announced via `trip:started` that have no GPS fix yet — promoted to a
  // real track the moment their first `location:update` arrives.
  final Map<String, ActiveTrip> _pendingTrips = {};
  String? _selectedTripId;

  bool _loading = true;
  bool _connected = false;
  String? _error;
  bool _firstFitDone = false;
  bool _tileError = false; // map tiles failed to load (offline / OSM blocked)
  int _tileEpoch = 0; // bump to force the tile layer to remount and retry
  bool _disposed = false; // guards late socket/timer callbacks during teardown
  Timer? _pollTimer;
  Timer? _clock;
  Timer? _refreshDebounce;

  // Drives both marker interpolation and the selected-pin pulse.
  late final AnimationController _ticker;

  // Akure / FUTA fallback until the first vehicle position arrives.
  static const LatLng _fallbackCenter = LatLng(7.3025, 5.1400);

  @override
  void initState() {
    super.initState();
    _ticker = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();

    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!_disposed && mounted && _selectedTripId != null) setState(() {});
    });

    _loadRoster();
    _initSocket();

    // Reconcile the roster periodically (new/ended trips, passenger counts).
    _pollTimer = Timer.periodic(
      const Duration(seconds: 20),
      (_) => _loadRoster(silent: true),
    );
  }

  @override
  void dispose() {
    // Set first: disconnect() below fires socket callbacks synchronously, and
    // those must not call setState on an element that's already being unmounted.
    _disposed = true;
    _pollTimer?.cancel();
    _clock?.cancel();
    _refreshDebounce?.cancel();
    _socket.clearListeners();
    _socket.dispose();
    _ticker.dispose();
    _mapController.dispose();
    super.dispose();
  }

  // ─── Data ─────────────────────────────────────────────────────────────────

  Future<void> _loadRoster({bool silent = false}) async {
    final token = context.read<AuthProvider>().token;
    if (token == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    try {
      final trips = await _repo.activeTrips(token);
      if (!mounted) return;
      final now = DateTime.now();
      setState(() {
        // Drop pending (no-GPS-yet) trips the server no longer lists — covers a
        // trip:ended broadcast missed while briefly disconnected.
        final allIds = trips.map((t) => t.tripId).toSet();
        _pendingTrips.removeWhere((id, _) => !allIds.contains(id));
        final activeIds = <String>{};
        for (final t in trips) {
          if (!t.hasLocation) continue;
          activeIds.add(t.tripId);
          final pos = LatLng(t.latitude!, t.longitude!);
          final existing = _tracks[t.tripId];
          if (existing == null) {
            _tracks[t.tripId] = _VehicleTrack(
              meta: t,
              position: pos,
              lastUpdateAt: t.lastLocationAt ?? now,
            );
          } else {
            existing.meta = t; // refresh capacity / passenger count / status
          }
        }
        _tracks.removeWhere((id, _) => !activeIds.contains(id));
        if (_selectedTripId != null && !_tracks.containsKey(_selectedTripId)) {
          _selectedTripId = null;
        }
        _loading = false;
        _error = null;
      });
      _maybeFitAll();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (!silent) _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (!silent) _error = 'Could not load the live map';
      });
    }
  }

  void _initSocket() {
    // Backend socketAuth accepts (and will eventually require) a JWT in the
    // handshake — send it now so tightening the server later won't break us.
    final token = context.read<AuthProvider>().token;
    _socket = io.io(
      widget.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': ?token})
          .disableAutoConnect()
          .build(),
    );
    _socket.connect();
    _socket.onConnect((_) {
      if (!_disposed && mounted) setState(() => _connected = true);
    });
    _socket.onDisconnect((_) {
      if (!_disposed && mounted) setState(() => _connected = false);
    });
    _socket.onConnectError((_) {
      if (!_disposed && mounted) setState(() => _connected = false);
    });

    _socket.on('location:update', (data) {
      if (_disposed || data == null) return;
      final update = LocationUpdate.fromJson(data as Map<String, dynamic>);
      final track = _tracks[update.tripId];
      if (track != null) {
        track.moveTo(update.latLng, DateTime.now());
        // No setState needed: the ticker rebuilds the marker layer every frame.
        return;
      }
      final pending = _pendingTrips.remove(update.tripId);
      if (pending != null) {
        // First GPS fix for a trip announced via `trip:started` — it becomes a
        // visible marker right now, no roster round-trip needed.
        setState(() {
          _tracks[update.tripId] = _VehicleTrack(
            meta: pending,
            position: update.latLng,
            lastUpdateAt: DateTime.now(),
          );
          _loading = false;
        });
        _maybeFitAll();
        return;
      }
      // A trip we don't know at all (started before this screen opened and the
      // roster hasn't caught it) — pull a fresh roster soon.
      _scheduleRosterRefresh();
    });

    // Trip lifecycle, live. `trip:started` carries the same row shape as
    // GET /tracking/active, so the roster grows without an extra fetch.
    _socket.on('trip:started', (data) {
      if (_disposed || data == null) return;
      final trip = ActiveTrip.fromJson(data as Map<String, dynamic>);
      if (_tracks.containsKey(trip.tripId)) return;
      if (trip.hasLocation) {
        setState(() {
          _tracks[trip.tripId] = _VehicleTrack(
            meta: trip,
            position: LatLng(trip.latitude!, trip.longitude!),
            lastUpdateAt: trip.lastLocationAt ?? DateTime.now(),
          );
        });
        _maybeFitAll();
      } else {
        // No GPS fix yet — hold it until its first location:update.
        _pendingTrips[trip.tripId] = trip;
      }
    });

    _socket.on('trip:ended', (data) {
      if (_disposed || data == null) return;
      final tripId = (data as Map<String, dynamic>)['trip_id'] as String?;
      if (tripId == null) return;
      _pendingTrips.remove(tripId);
      if (!_tracks.containsKey(tripId)) return;
      setState(() {
        _tracks.remove(tripId);
        if (_selectedTripId == tripId) _selectedTripId = null;
      });
    });

    // Live occupancy: a student tapped in or out. Updates the count shown in
    // the info sheet instantly instead of waiting for the 20s roster poll.
    _socket.on('trip:passengers', (data) {
      if (_disposed || data == null) return;
      final map = data as Map<String, dynamic>;
      final tripId = map['trip_id'] as String?;
      final count = map['passenger_count'];
      if (tripId == null || count is! num) return;
      final track = _tracks[tripId];
      if (track != null) {
        setState(() {
          track.meta = track.meta.copyWith(passengerCount: count.toInt());
        });
      } else if (_pendingTrips.containsKey(tripId)) {
        _pendingTrips[tripId] =
            _pendingTrips[tripId]!.copyWith(passengerCount: count.toInt());
      }
    });
  }

  void _scheduleRosterRefresh() {
    if (_refreshDebounce?.isActive ?? false) return;
    _refreshDebounce = Timer(
      const Duration(seconds: 2),
      () => _loadRoster(silent: true),
    );
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  void _maybeFitAll() {
    if (_firstFitDone) return;
    final points = _tracks.values.map((t) => t.target).toList();
    if (points.isEmpty) return;
    _firstFitDone = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (points.length == 1) {
        _mapController.move(points.first, 15.5);
      } else {
        _mapController.fitCamera(
          CameraFit.coordinates(
            coordinates: points,
            padding: const EdgeInsets.all(64),
            maxZoom: 16,
          ),
        );
      }
    });
  }

  void _fitAll() {
    HapticFeedback.selectionClick();
    final points = _tracks.values.map((t) => t.target).toList();
    if (points.isEmpty) return;
    if (points.length == 1) {
      _mapController.move(points.first, 15.5);
    } else {
      _mapController.fitCamera(
        CameraFit.coordinates(
          coordinates: points,
          padding: const EdgeInsets.all(64),
          maxZoom: 16,
        ),
      );
    }
  }

  void _select(String tripId) {
    HapticFeedback.selectionClick();
    // The info panel simply overlays the map — the map never re-centres or
    // halts, so vehicles keep gliding while a panel is open.
    setState(() => _selectedTripId = tripId);
  }

  void _deselect() {
    if (_selectedTripId != null) setState(() => _selectedTripId = null);
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final selected =
        _selectedTripId == null ? null : _tracks[_selectedTripId];

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: Stack(
          children: [
            Positioned.fill(child: _buildMap()),
            _buildTopScrim(),
            _buildBackButton(),
            _buildFitButton(),
            if (_loading) _buildLoadingPill(),
            _buildConnectivityBanner(),
            Align(
              alignment: Alignment.bottomCenter,
              child: selected != null
                  ? _VehicleInfoSheet(
                      key: ValueKey(selected.meta.tripId),
                      track: selected,
                      onClose: _deselect,
                    )
                  : _SummaryBar(
                      count: _tracks.length,
                      connected: _connected,
                      loading: _loading,
                      error: _error,
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMap() {
    final initialCenter =
        _tracks.isNotEmpty ? _tracks.values.first.target : _fallbackCenter;

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: initialCenter,
        initialZoom: 15.0,
        maxZoom: 18.0,
        minZoom: 11.0,
        backgroundColor: const Color(0xFFEAE7E1),
        onTap: (_, _) => _deselect(),
      ),
      children: [
        TileLayer(
          key: ValueKey(_tileEpoch),
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.movio.app',
          // OSM's tile policy rejects requests without a descriptive User-Agent;
          // set one explicitly (kept via putIfAbsent by flutter_map).
          // NOTE: not a const map — flutter_map calls putIfAbsent on it.
          tileProvider: NetworkTileProvider(
            headers: {
              'User-Agent': 'MovIO/1.0 (FUTA campus transit; final-year project)',
            },
          ),
          // Surface tile failures (offline / blocked) as an on-screen indicator
          // instead of a silently blank map.
          errorTileCallback: (tile, error, stackTrace) {
            if (mounted && !_tileError) {
              setState(() => _tileError = true);
            }
          },
        ),
        AnimatedBuilder(
          animation: _ticker,
          builder: (context, _) {
            final now = DateTime.now();
            return MarkerLayer(
              markers: _tracks.values.map((track) {
                return Marker(
                  point: track.positionAt(now),
                  width: 78,
                  height: 78,
                  child: _VehiclePin(
                    type: track.meta.vehicleType,
                    selected: track.meta.tripId == _selectedTripId,
                    pulse: _ticker,
                    onTap: () => _select(track.meta.tripId),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTopScrim() {
    return IgnorePointer(
      child: Container(
        height: MediaQuery.of(context).padding.top + 64,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.ink.withValues(alpha: 0.16),
              AppColors.ink.withValues(alpha: 0.0),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackButton() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + AppSpacing.sm,
      left: AppSpacing.lg,
      child: _MapChipButton(
        icon: Icons.arrow_back_rounded,
        onTap: () => Navigator.of(context).maybePop(),
      ),
    );
  }

  Widget _buildFitButton() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + AppSpacing.sm,
      right: AppSpacing.lg,
      child: _MapChipButton(
        icon: Icons.center_focus_strong_rounded,
        onTap: _fitAll,
      ),
    );
  }

  Widget _buildLoadingPill() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 56,
      left: 0,
      right: 0,
      child: const Center(child: _Pill(text: 'Loading live map…', spinner: true)),
    );
  }

  void _retryTiles() {
    HapticFeedback.selectionClick();
    setState(() {
      _tileError = false;
      _tileEpoch++; // remounts the tile layer → re-requests tiles
    });
  }

  /// Offline / can't-load-tiles indicator. Socket-down takes priority (the live
  /// feed itself is gone); otherwise a tile failure offers a retry.
  Widget _buildConnectivityBanner() {
    final socketDown = !_connected;
    final tileDown = _tileError && _connected;
    if (!socketDown && !tileDown) return const SizedBox.shrink();

    // While first loading the socket is legitimately not connected yet — don't
    // flash the banner until we've settled.
    if (socketDown && _loading) return const SizedBox.shrink();

    return Positioned(
      top: MediaQuery.of(context).padding.top + 56,
      left: 0,
      right: 0,
      child: Center(
        child: _WarningPill(
          text: socketDown
              ? 'Live tracking disconnected — reconnecting…'
              : 'Map tiles unavailable — tap to retry',
          onRetry: tileDown ? _retryTiles : null,
        ),
      ),
    );
  }
}

// ─── Vehicle pin ──────────────────────────────────────────────────────────────

class _VehiclePin extends StatelessWidget {
  const _VehiclePin({
    required this.type,
    required this.selected,
    required this.pulse,
    required this.onTap,
  });

  final String type;
  final bool selected;
  final Animation<double> pulse;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (icon, color, _) = _styleFor(type);
    final size = selected ? 50.0 : 40.0;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: pulse,
        builder: (context, child) {
          return Stack(
            alignment: Alignment.center,
            children: [
              if (selected) ...[
                _ring(color, phase: 0.0),
                _ring(color, phase: 0.5),
              ],
              child!,
            ],
          );
        },
        child: Container(
          height: size,
          width: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: selected ? color : AppColors.surface,
            border: Border.all(
              color: selected ? AppColors.onBrand : color,
              width: selected ? 3 : 2,
            ),
            boxShadow: [
              BoxShadow(
                color: (selected ? color : AppColors.ink)
                    .withValues(alpha: selected ? 0.45 : 0.22),
                blurRadius: selected ? 14 : 7,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Icon(
            icon,
            size: selected ? 24 : 20,
            color: selected ? AppColors.onBrand : color,
          ),
        ),
      ),
    );
  }

  Widget _ring(Color color, {required double phase}) {
    final t = (pulse.value + phase) % 1.0;
    final size = 44 + 30 * t;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: (1 - t) * 0.3),
      ),
    );
  }
}

// ─── Info panel (a vehicle is selected) ──────────────────────────────────────

class _VehicleInfoSheet extends StatelessWidget {
  const _VehicleInfoSheet({
    super.key,
    required this.track,
    required this.onClose,
  });

  final _VehicleTrack track;
  final VoidCallback onClose;

  String get _lastSeen {
    final s = DateTime.now().difference(track.lastUpdateAt).inSeconds;
    if (s <= 1) return 'moving now';
    if (s < 60) return '${s}s ago';
    return '${s ~/ 60}m ago';
  }

  @override
  Widget build(BuildContext context) {
    final meta = track.meta;
    final (icon, color, label) = _styleFor(meta.vehicleType);
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final occupancy =
        meta.capacity > 0 ? (meta.passengerCount / meta.capacity).clamp(0.0, 1.0) : 0.0;

    return Container(
      margin: EdgeInsets.fromLTRB(
          AppSpacing.lg, 0, AppSpacing.lg, bottomInset + AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brXl,
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.18),
            blurRadius: 30,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 42,
                width: 42,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: AppRadius.brMd,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(meta.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.titleMd),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(label,
                            style: AppTypography.caption
                                .copyWith(color: color, fontWeight: FontWeight.w600)),
                        const SizedBox(width: AppSpacing.sm),
                        const _StatusPill(),
                      ],
                    ),
                  ],
                ),
              ),
              _CloseButton(onTap: onClose),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _InfoCell(
                  icon: Icons.person_outline_rounded,
                  label: 'Driver',
                  value: meta.driverName.isEmpty ? '—' : meta.driverName,
                ),
              ),
              Container(width: 1, height: 34, color: AppColors.line),
              Expanded(
                child: _InfoCell(
                  icon: Icons.confirmation_number_outlined,
                  label: 'Vehicle no.',
                  value: meta.plateNumber,
                  mono: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          // Occupancy — onboarded vs capacity, with a bar.
          Row(
            children: [
              Text('Onboarded', style: AppTypography.caption),
              const Spacer(),
              Text(
                '${meta.passengerCount} / ${meta.capacity} seats',
                style: AppTypography.dataMd.copyWith(fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: occupancy,
              minHeight: 7,
              backgroundColor: AppColors.lineSoft,
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              const _LiveDot(),
              const SizedBox(width: AppSpacing.sm),
              Text('Position updated $_lastSeen',
                  style: AppTypography.caption),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoCell extends StatelessWidget {
  const _InfoCell({
    required this.icon,
    required this.label,
    required this.value,
    this.mono = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppColors.inkMuted),
            const SizedBox(width: 5),
            Text(label.toUpperCase(),
                style: AppTypography.caption.copyWith(
                  fontSize: 10,
                  letterSpacing: 0.6,
                  color: AppColors.inkMuted,
                  fontWeight: FontWeight.w600,
                )),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: mono
              ? AppTypography.dataMd.copyWith(fontSize: 14)
              : AppTypography.label,
        ),
      ],
    );
  }
}

// ─── Summary bar (nothing selected) ──────────────────────────────────────────

class _SummaryBar extends StatelessWidget {
  const _SummaryBar({
    required this.count,
    required this.connected,
    required this.loading,
    required this.error,
  });

  final int count;
  final bool connected;
  final bool loading;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    final String headline;
    if (error != null) {
      headline = error!;
    } else if (loading) {
      headline = 'Finding active shuttles…';
    } else if (count == 0) {
      headline = 'No vehicle active on campus';
    } else {
      headline = '$count vehicle${count == 1 ? '' : 's'} moving on campus';
    }

    return Container(
      margin: EdgeInsets.fromLTRB(
          AppSpacing.lg, 0, AppSpacing.lg, bottomInset + AppSpacing.lg),
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brLg,
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.14),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _LiveDot(muted: count == 0 || !connected),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(headline,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.label),
              ),
              if (count > 0)
                Text('Tap a vehicle',
                    style: AppTypography.caption
                        .copyWith(color: AppColors.inkFaint)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          const Divider(height: 1, color: AppColors.lineSoft),
          const SizedBox(height: AppSpacing.sm),
          const Wrap(
            spacing: AppSpacing.lg,
            runSpacing: 6,
            children: [
              _LegendChip(type: 'bus'),
              _LegendChip(type: 'cab'),
              _LegendChip(type: 'tricycle'),
            ],
          ),
        ],
      ),
    );
  }
}

class _LegendChip extends StatelessWidget {
  const _LegendChip({required this.type});

  final String type;

  @override
  Widget build(BuildContext context) {
    final (icon, color, label) = _styleFor(type);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 5),
        Text(label, style: AppTypography.caption),
      ],
    );
  }
}

// ─── Small shared pieces ─────────────────────────────────────────────────────

class _MapChipButton extends StatelessWidget {
  const _MapChipButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Container(
          height: 44,
          width: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.line),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink.withValues(alpha: 0.10),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Icon(icon, size: 20, color: AppColors.ink),
        ),
      ),
    );
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.lineSoft,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: const SizedBox(
          height: 32,
          width: 32,
          child: Icon(Icons.close_rounded, size: 18, color: AppColors.inkMuted),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.brand50,
        borderRadius: AppRadius.brSm,
      ),
      child: Text('Active',
          style: AppTypography.caption.copyWith(
            color: AppColors.brand700,
            fontSize: 10,
            fontWeight: FontWeight.w700,
          )),
    );
  }
}

class _LiveDot extends StatelessWidget {
  const _LiveDot({this.muted = false});

  final bool muted;

  @override
  Widget build(BuildContext context) {
    final color = muted ? AppColors.inkFaint : AppColors.success;
    return Container(
      height: 9,
      width: 9,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: muted
            ? null
            : [BoxShadow(color: color.withValues(alpha: 0.5), blurRadius: 6)],
      ),
    );
  }
}

/// Amber connectivity warning pill, optionally tappable to retry.
class _WarningPill extends StatelessWidget {
  const _WarningPill({required this.text, this.onRetry});

  final String text;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onRetry,
        child: Container(
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: AppColors.ink,
            borderRadius: BorderRadius.circular(999),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink.withValues(alpha: 0.25),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                onRetry != null ? Icons.wifi_off_rounded : Icons.sync_rounded,
                size: 14,
                color: AppColors.warning,
              ),
              const SizedBox(width: AppSpacing.sm),
              Flexible(
                child: Text(
                  text,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.caption.copyWith(color: AppColors.onBrand),
                ),
              ),
              if (onRetry != null) ...[
                const SizedBox(width: AppSpacing.sm),
                const Icon(Icons.refresh_rounded,
                    size: 15, color: AppColors.onBrand),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, this.spinner = false});

  final String text;
  final bool spinner;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.pill == 999
            ? BorderRadius.circular(999)
            : AppRadius.brLg,
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.12),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (spinner) ...[
            const SizedBox(
              height: 14,
              width: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(AppColors.brand600),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
          ],
          Text(text, style: AppTypography.caption),
        ],
      ),
    );
  }
}
