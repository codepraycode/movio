import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/list_states.dart';
import '../../../shared/widgets/screen_header.dart';
import '../../auth/state/auth_provider.dart';
import '../data/trips_history_repository.dart';

/// "My trips" (MOB-7 companion): the student's boarding history — every trip
/// they tapped onto, with the vehicle, driver, route and times. One tap-in is
/// one Transit Credit, so this doubles as the account of where credits went.
class MyTripsScreen extends StatefulWidget {
  const MyTripsScreen({super.key});

  @override
  State<MyTripsScreen> createState() => _MyTripsScreenState();
}

class _MyTripsScreenState extends State<MyTripsScreen> {
  final TripsHistoryRepository _repo = TripsHistoryRepository();

  List<BoardedTrip>? _trips;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;
    try {
      final trips = await _repo.myTrips(token);
      if (!mounted) return;
      setState(() {
        _trips = trips;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Couldn’t load your trips');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: AppBackground(
          child: SafeArea(
            child: Column(
              children: [
                const ScreenHeader(title: 'My trips'),
                Expanded(child: _buildBody()),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    final trips = _trips;

    if (_error != null && trips == null) {
      return ListMessage(
        icon: Icons.cloud_off_rounded,
        title: _error!,
        body: 'Pull down to try again.',
        onRefresh: _load,
      );
    }
    if (trips == null) return const ListLoading();
    if (trips.isEmpty) {
      return ListMessage(
        icon: Icons.directions_bus_rounded,
        title: 'No trips yet',
        body:
            'When you board a shuttle, every trip shows up here with its '
            'vehicle, driver and route.',
        onRefresh: _load,
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.brand600,
      backgroundColor: AppColors.surface,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.page),
        itemCount: trips.length,
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, i) => Entrance(
          // Stagger only the first screenful; later rows appear instantly.
          delay: Duration(milliseconds: 50 * (i < 8 ? i : 0)),
          child: _TripCard(trip: trips[i]),
        ),
      ),
    );
  }
}

// ─── Trip card ───────────────────────────────────────────────────────────────

/// (icon, accent, label) per vehicle_type — same trio the live map uses.
(IconData, Color, String) _vehicleStyle(String type) {
  switch (type) {
    case 'cab':
      return (Icons.local_taxi_rounded, AppColors.warning, 'Cab');
    case 'tricycle':
      return (Icons.electric_rickshaw, const Color(0xFF0F766E), 'Keke');
    case 'bus':
    default:
      return (Icons.directions_bus_rounded, AppColors.brand600, 'Shuttle');
  }
}

class _TripCard extends StatelessWidget {
  const _TripCard({required this.trip});

  final BoardedTrip trip;

  @override
  Widget build(BuildContext context) {
    final (icon, accent, kind) = _vehicleStyle(trip.vehicleType);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 42,
                width: 42,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: AppRadius.brMd,
                ),
                child: Icon(icon, size: 22, color: accent),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      trip.routeName ?? '$kind ride',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.titleMd,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${trip.plateNumber} · ${trip.driverName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              trip.isAboard
                  ? const _AboardBadge()
                  : Text(
                      '−1 credit',
                      style: AppTypography.dataMd.copyWith(
                        fontSize: 13,
                        color: AppColors.inkMuted,
                      ),
                    ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(height: 1, color: AppColors.lineSoft),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              _TimeCell(label: 'Tapped in', time: trip.boardedAt),
              const SizedBox(width: AppSpacing.xl),
              trip.alightedAt != null
                  ? _TimeCell(label: 'Tapped out', time: trip.alightedAt!)
                  : Expanded(
                      child: Text(
                        trip.isAboard
                            ? 'Still aboard'
                            : 'Trip ended before tap-out',
                        style: AppTypography.caption,
                      ),
                    ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimeCell extends StatelessWidget {
  const _TimeCell({required this.label, required this.time});

  final String label;
  final DateTime time;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption),
        const SizedBox(height: 2),
        Text(
          formatDayTime(time),
          style: AppTypography.caption.copyWith(
            fontFamily: AppTypography.mono,
            color: AppColors.ink,
          ),
        ),
      ],
    );
  }
}

/// Small live badge for a boarding that's still open on an active trip.
class _AboardBadge extends StatelessWidget {
  const _AboardBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.brand50,
        borderRadius: AppRadius.brSm,
        border: Border.all(color: AppColors.brand200),
      ),
      child: Text(
        'ABOARD',
        style: AppTypography.caption.copyWith(
          color: AppColors.brand700,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

