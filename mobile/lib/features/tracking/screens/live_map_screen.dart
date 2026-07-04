import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/config/env.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';

/// Mirrors the backend `LocationUpdate` interface emitted on the `location:update`
/// Socket.io event (backend/src/types/index.ts).
class LocationUpdate {
  final String updateId;
  final String tripId;
  final double latitude;
  final double longitude;
  final DateTime recordedAt;

  LocationUpdate({
    required this.updateId,
    required this.tripId,
    required this.latitude,
    required this.longitude,
    required this.recordedAt,
  });

  LatLng get latLng => LatLng(latitude, longitude);

  factory LocationUpdate.fromJson(Map<String, dynamic> json) {
    return LocationUpdate(
      updateId: json['update_id'] as String,
      tripId: json['trip_id'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      recordedAt: DateTime.parse(json['recorded_at'] as String),
    );
  }
}

/// How fresh the live feed is right now — drives the status sheet + marker colour.
enum _FeedStatus { connecting, waiting, live, delayed, offline }

/// Full-bleed live shuttle tracker. Listens to the backend `location:update`
/// stream over Socket.io, filters to a single [tripId], and smoothly interpolates
/// the vehicle marker between GPS pings so it glides instead of teleporting.
///
/// The socket/animation/MapController plumbing is intentionally the same shape as
/// the working foundation — the upgrade here is presentation: a premium marker,
/// a rich status sheet, and integrated map controls.
class LiveMapScreen extends StatefulWidget {
  final String tripId;

  /// Socket.io origin (host:port, no `/api/v1`). Defaults to the configured
  /// backend so callers usually only pass a [tripId].
  final String socketUrl;

  LiveMapScreen({
    super.key,
    required this.tripId,
    String? socketUrl,
  }) : socketUrl = socketUrl ?? Env.socketUrl;

  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen>
    with TickerProviderStateMixin {
  late io.Socket _socket;
  final MapController _mapController = MapController();

  LocationUpdate? _currentUpdate;
  LatLng? _previousLocation;
  LatLng? _currentLocation;
  int _updateCount = 0;
  DateTime? _lastUpdateAt;
  bool _connected = false;

  bool _trackUserCamera = true;

  // Interpolates the marker between two consecutive pings (unchanged logic).
  late final AnimationController _movementController;
  Animation<LatLng>? _markerPositionAnimation;

  // Continuous, decorative pulse behind the marker — never stops.
  late final AnimationController _pulseController;

  // Rebuilds the "x seconds ago" label and re-evaluates staleness once a second.
  Timer? _clock;

  static const _staleAfter = Duration(seconds: 15);

  @override
  void initState() {
    super.initState();

    _movementController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2200),
      vsync: this,
    )..repeat();

    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });

    _initSocket();
  }

  // ─── Networking (logic preserved) ─────────────────────────────────────────

  void _initSocket() {
    _socket = io.io(
      widget.socketUrl,
      io.OptionBuilder().setTransports(['websocket']).disableAutoConnect().build(),
    );

    _socket.connect();

    _socket.onConnect((_) {
      debugPrint('Connected to Location Socket Server');
      if (mounted) setState(() => _connected = true);
    });

    _socket.onDisconnect((_) {
      if (mounted) setState(() => _connected = false);
    });

    _socket.onConnectError((_) {
      if (mounted) setState(() => _connected = false);
    });

    _socket.on('location:update', (data) {
      if (data == null) return;

      final update = LocationUpdate.fromJson(data as Map<String, dynamic>);
      if (update.tripId != widget.tripId) return;

      _animateMarkerTo(update.latLng, update);
    });
  }

  void _animateMarkerTo(LatLng targetLocation, LocationUpdate update) {
    if (!mounted) return;

    setState(() {
      _currentUpdate = update;
      _previousLocation = _currentLocation ?? targetLocation;
      _currentLocation = targetLocation;
      _lastUpdateAt = DateTime.now();
      _updateCount++;

      _markerPositionAnimation = Tween<LatLng>(
        begin: _previousLocation,
        end: _currentLocation,
      ).animate(CurvedAnimation(
        parent: _movementController,
        curve: Curves.easeInOutCubic,
      ));
    });

    _movementController.forward(from: 0.0);

    if (_trackUserCamera) {
      _mapController.move(targetLocation, _mapController.camera.zoom);
    }
  }

  @override
  void dispose() {
    _clock?.cancel();
    _socket.disconnect();
    _socket.dispose();
    _movementController.dispose();
    _pulseController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  // ─── Derived status ───────────────────────────────────────────────────────

  _FeedStatus get _status {
    if (_currentUpdate == null) {
      return _connected ? _FeedStatus.waiting : _FeedStatus.connecting;
    }
    if (!_connected) return _FeedStatus.offline;
    final since = _lastUpdateAt == null
        ? Duration.zero
        : DateTime.now().difference(_lastUpdateAt!);
    return since > _staleAfter ? _FeedStatus.delayed : _FeedStatus.live;
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final initialPosition = _currentLocation ?? const LatLng(6.5244, 3.3792);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: Stack(
          children: [
            _buildMap(initialPosition),
            _buildTopScrim(),
            _buildBackButton(),
            _buildMapControls(),
            Align(
              alignment: Alignment.bottomCenter,
              child: _buildStatusSheet(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMap(LatLng initialPosition) {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: initialPosition,
        initialZoom: 15.0,
        maxZoom: 18.0,
        minZoom: 12.0,
        backgroundColor: AppColors.paper,
        onPositionChanged: (camera, hasGesture) {
          if (hasGesture && _trackUserCamera) {
            setState(() => _trackUserCamera = false);
          }
        },
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.movio.app',
        ),
        if (_markerPositionAnimation != null)
          AnimatedBuilder(
            animation: _markerPositionAnimation!,
            builder: (context, child) {
              return MarkerLayer(
                markers: [
                  Marker(
                    point: _markerPositionAnimation!.value,
                    width: 120,
                    height: 120,
                    child: _buildLiveVehicleMarker(),
                  ),
                ],
              );
            },
          ),
      ],
    );
  }

  /// Soft top fade so the status-bar icons and the back button stay legible over
  /// busy map tiles.
  Widget _buildTopScrim() {
    return IgnorePointer(
      child: Container(
        height: MediaQuery.of(context).padding.top + 72,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.ink.withValues(alpha: 0.18),
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

  // ─── Marker ───────────────────────────────────────────────────────────────

  Widget _buildLiveVehicleMarker() {
    // Delayed/offline feeds desaturate to amber so a frozen dot never reads as
    // confidently "live".
    final isLive = _status == _FeedStatus.live;
    final accent = isLive ? AppColors.brand600 : AppColors.warning;

    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Stack(
          alignment: Alignment.center,
          children: [
            // Two staggered expanding rings — the "signal" pulse.
            if (isLive) ...[
              _pulseRing(accent, phase: 0.0),
              _pulseRing(accent, phase: 0.5),
            ],
            child!,
          ],
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // The badge itself.
          Container(
            height: 46,
            width: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: isLive ? AppColors.brandGradient : null,
              color: isLive ? null : AppColors.warning,
              border: Border.all(color: AppColors.onBrand, width: 3),
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: 0.45),
                  blurRadius: 14,
                  spreadRadius: 1,
                ),
                BoxShadow(
                  color: AppColors.ink.withValues(alpha: 0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(
              Icons.directions_bus_rounded,
              color: AppColors.onBrand,
              size: 22,
            ),
          ),
          const SizedBox(height: 3),
          // A small ground shadow anchors the badge to the map.
          Container(
            height: 5,
            width: 22,
            decoration: BoxDecoration(
              color: AppColors.ink.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pulseRing(Color color, {required double phase}) {
    final t = (_pulseController.value + phase) % 1.0;
    final size = 40 + (72 * t); // grows outward
    final opacity = (1.0 - t) * 0.35; // fades as it grows
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: opacity),
      ),
    );
  }

  // ─── Map controls ─────────────────────────────────────────────────────────

  Widget _buildMapControls() {
    // Sits just above the status sheet; padding keeps it clear of the notch too.
    return Positioned(
      right: AppSpacing.lg,
      bottom: 210,
      child: Column(
        children: [
          _MapChipButton(
            icon: Icons.add_rounded,
            onTap: () => _zoomBy(1),
          ),
          const SizedBox(height: AppSpacing.sm),
          _MapChipButton(
            icon: Icons.remove_rounded,
            onTap: () => _zoomBy(-1),
          ),
          const SizedBox(height: AppSpacing.md),
          // Recenter lights up (brand-filled) only when the camera has drifted
          // off the vehicle — the classic "tap to follow again" affordance.
          _MapChipButton(
            icon: _trackUserCamera
                ? Icons.my_location_rounded
                : Icons.location_searching_rounded,
            active: !_trackUserCamera,
            onTap: _recenter,
          ),
        ],
      ),
    );
  }

  void _zoomBy(double delta) {
    final camera = _mapController.camera;
    final next = (camera.zoom + delta).clamp(12.0, 18.0);
    _mapController.move(camera.center, next);
  }

  void _recenter() {
    HapticFeedback.selectionClick();
    setState(() => _trackUserCamera = true);
    if (_currentLocation != null) {
      _mapController.move(_currentLocation!, 15.0);
    }
  }

  // ─── Status sheet ─────────────────────────────────────────────────────────

  Widget _buildStatusSheet() {
    final status = _status;
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Container(
      margin: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        bottomInset + AppSpacing.lg,
      ),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.md,
        AppSpacing.xl,
        AppSpacing.xl,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brXl,
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.16),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Grabber handle.
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.line,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            children: [
              _StatusDot(status: status, pulse: _pulseController),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  _statusTitle(status),
                  style: AppTypography.titleMd,
                ),
              ),
              _TripChip(tripId: widget.tripId),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            _statusSubtitle(status),
            style: AppTypography.caption,
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildMetrics(),
        ],
      ),
    );
  }

  Widget _buildMetrics() {
    final coords = _currentLocation == null
        ? '—, —'
        : '${_currentLocation!.latitude.toStringAsFixed(5)}, '
            '${_currentLocation!.longitude.toStringAsFixed(5)}';

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.brand50,
        borderRadius: AppRadius.brMd,
        border: Border.all(color: AppColors.brand100),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _Metric(
                  icon: Icons.schedule_rounded,
                  label: 'Last ping',
                  value: _lastPingLabel(),
                ),
              ),
              Container(width: 1, height: 34, color: AppColors.brand100),
              Expanded(
                child: _Metric(
                  icon: Icons.sync_rounded,
                  label: 'Updates',
                  value: '$_updateCount',
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Divider(height: 1, color: AppColors.brand100),
          ),
          Row(
            children: [
              const Icon(Icons.place_rounded,
                  size: 16, color: AppColors.brand600),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  coords,
                  style: AppTypography.dataMd.copyWith(
                    fontSize: 13,
                    color: AppColors.brand800,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Status copy ──────────────────────────────────────────────────────────

  String _statusTitle(_FeedStatus s) {
    switch (s) {
      case _FeedStatus.connecting:
        return 'Connecting…';
      case _FeedStatus.waiting:
        return 'Waiting for shuttle';
      case _FeedStatus.live:
        return 'Live tracking';
      case _FeedStatus.delayed:
        return 'Signal delayed';
      case _FeedStatus.offline:
        return 'Connection lost';
    }
  }

  String _statusSubtitle(_FeedStatus s) {
    switch (s) {
      case _FeedStatus.connecting:
        return 'Reaching the live tracking server…';
      case _FeedStatus.waiting:
        return 'Connected — waiting for the first position report.';
      case _FeedStatus.live:
        return 'Following the shuttle in real time.';
      case _FeedStatus.delayed:
        return 'No new position for a while — the last known spot is shown.';
      case _FeedStatus.offline:
        return 'Reconnecting to the live stream…';
    }
  }

  String _lastPingLabel() {
    if (_lastUpdateAt == null) return '—';
    final s = DateTime.now().difference(_lastUpdateAt!).inSeconds;
    if (s <= 1) return 'now';
    if (s < 60) return '${s}s ago';
    final m = s ~/ 60;
    return '${m}m ago';
  }
}

// ─── Small presentational pieces ──────────────────────────────────────────────

/// A minimal circular map control. Frosted-white by default; brand-filled when
/// [active] (used to invite re-centering).
class _MapChipButton extends StatelessWidget {
  const _MapChipButton({
    required this.icon,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.brand600 : AppColors.surface,
      shape: const CircleBorder(),
      elevation: 0,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Container(
          height: 44,
          width: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: active ? AppColors.brand600 : AppColors.line,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink.withValues(alpha: 0.10),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Icon(
            icon,
            size: 20,
            color: active ? AppColors.onBrand : AppColors.ink,
          ),
        ),
      ),
    );
  }
}

/// Pulsing status indicator: a coloured core inside a breathing halo. Green when
/// live, amber otherwise.
class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.status, required this.pulse});

  final _FeedStatus status;
  final Animation<double> pulse;

  @override
  Widget build(BuildContext context) {
    final live = status == _FeedStatus.live;
    final color = live ? AppColors.success : AppColors.warning;

    return SizedBox(
      width: 14,
      height: 14,
      child: AnimatedBuilder(
        animation: pulse,
        builder: (context, _) {
          final t = pulse.value;
          return Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 8 + (6 * t),
                height: 8 + (6 * t),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: (1 - t) * 0.4),
                ),
              ),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Monospace trip-id pill — reads as real telemetry, and truncates long ids.
class _TripChip extends StatelessWidget {
  const _TripChip({required this.tripId});

  final String tripId;

  @override
  Widget build(BuildContext context) {
    final shortId = tripId.length > 8 ? '${tripId.substring(0, 8)}…' : tripId;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.lineSoft,
        borderRadius: AppRadius.brSm,
      ),
      child: Text(
        'TRIP $shortId',
        style: AppTypography.dataMd.copyWith(
          fontSize: 11,
          color: AppColors.inkMuted,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

/// One label/value stat inside the metrics strip.
class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppColors.brand600),
            const SizedBox(width: 6),
            Text(
              label.toUpperCase(),
              style: AppTypography.caption.copyWith(
                fontSize: 10,
                letterSpacing: 0.6,
                color: AppColors.inkMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTypography.dataMd.copyWith(
            fontSize: 15,
            color: AppColors.brand800,
          ),
        ),
      ],
    );
  }
}
