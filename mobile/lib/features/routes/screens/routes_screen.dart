import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/list_states.dart';
import '../../../shared/widgets/screen_header.dart';
import '../../auth/state/auth_provider.dart';
import '../../tracking/screens/live_map_screen.dart';
import '../data/routes_repository.dart';

/// Route/schedule info (PSD-158, MOB-8): the campus routes admins created
/// (FE-7) with their stops in board order. There is no timetable in the system
/// — shuttles loop continuously — so instead of inventing departure times this
/// screen says so honestly and points at the live map, which is the schedule.
class RoutesScreen extends StatefulWidget {
  const RoutesScreen({super.key});

  @override
  State<RoutesScreen> createState() => _RoutesScreenState();
}

class _RoutesScreenState extends State<RoutesScreen> {
  final RoutesRepository _repo = RoutesRepository();

  List<TransitRoute>? _routes;
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
      final routes = await _repo.activeRoutes(token);
      if (!mounted) return;
      setState(() {
        _routes = routes;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Couldn’t load routes');
    }
  }

  void _openLiveMap() {
    HapticFeedback.selectionClick();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => LiveMapScreen()),
    );
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
                const ScreenHeader(title: 'Routes & stops'),
                Expanded(child: _buildBody()),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    final routes = _routes;

    if (_error != null && routes == null) {
      return ListMessage(
        icon: Icons.cloud_off_rounded,
        title: _error!,
        body: 'Pull down to try again.',
        onRefresh: _load,
      );
    }
    if (routes == null) return const ListLoading(itemHeight: 88);
    if (routes.isEmpty) {
      return ListMessage(
        icon: Icons.route_rounded,
        title: 'No routes yet',
        body: 'Campus routes will appear here once the transport '
            'office publishes them.',
        onRefresh: _load,
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.brand600,
      backgroundColor: AppColors.surface,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.page),
        children: [
          for (var i = 0; i < routes.length; i++) ...[
            Entrance(
              delay: Duration(milliseconds: 60 * (i < 8 ? i : 0)),
              child: _RouteCard(route: routes[i], initiallyOpen: i == 0),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          const SizedBox(height: AppSpacing.sm),
          Entrance(
            delay: const Duration(milliseconds: 200),
            child: _LiveMapHint(onTap: _openLiveMap),
          ),
        ],
      ),
    );
  }
}

// ─── Route card with expandable stop timeline ────────────────────────────────

class _RouteCard extends StatefulWidget {
  const _RouteCard({required this.route, this.initiallyOpen = false});

  final TransitRoute route;
  final bool initiallyOpen;

  @override
  State<_RouteCard> createState() => _RouteCardState();
}

class _RouteCardState extends State<_RouteCard> {
  late bool _open = widget.initiallyOpen;

  @override
  Widget build(BuildContext context) {
    final route = widget.route;
    final stopCount = route.stops.length;
    return Material(
      color: AppColors.surface,
      borderRadius: AppRadius.brLg,
      child: InkWell(
        borderRadius: AppRadius.brLg,
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _open = !_open);
        },
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            border: Border.all(
                color: _open ? AppColors.brand200 : AppColors.line),
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
                      color: AppColors.brand50,
                      borderRadius: AppRadius.brMd,
                    ),
                    child: const Icon(Icons.route_rounded,
                        size: 22, color: AppColors.brand700),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          route.routeName,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.titleMd,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$stopCount ${stopCount == 1 ? 'stop' : 'stops'}',
                          style: AppTypography.caption,
                        ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: _open ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(Icons.expand_more_rounded,
                        size: 22, color: AppColors.inkMuted),
                  ),
                ],
              ),
              // Stops expand/collapse smoothly; the timeline is board order.
              AnimatedSize(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutCubic,
                alignment: Alignment.topCenter,
                child: _open
                    ? Padding(
                        padding: const EdgeInsets.only(top: AppSpacing.lg),
                        child: _StopTimeline(stops: route.stops),
                      )
                    : const SizedBox(width: double.infinity),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Vertical dot-and-line timeline of stops. First and last are terminals
/// (filled brand dots); intermediate stops are hollow.
class _StopTimeline extends StatelessWidget {
  const _StopTimeline({required this.stops});

  final List<TransitStop> stops;

  @override
  Widget build(BuildContext context) {
    if (stops.isEmpty) {
      return Text('Stops not published yet.', style: AppTypography.caption);
    }
    return Column(
      children: [
        for (var i = 0; i < stops.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: 24,
                  child: Column(
                    children: [
                      Expanded(
                        child: Container(
                          width: 2,
                          color: i == 0 ? Colors.transparent : AppColors.brand200,
                        ),
                      ),
                      _StopDot(terminal: i == 0 || i == stops.length - 1),
                      Expanded(
                        child: Container(
                          width: 2,
                          color: i == stops.length - 1
                              ? Colors.transparent
                              : AppColors.brand200,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    child: Text(
                      stops[i].name,
                      style: (i == 0 || i == stops.length - 1)
                          ? AppTypography.bodyMd
                              .copyWith(fontWeight: FontWeight.w600)
                          : AppTypography.bodyMd,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _StopDot extends StatelessWidget {
  const _StopDot({required this.terminal});

  final bool terminal;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: terminal ? 12 : 9,
      width: terminal ? 12 : 9,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: terminal ? AppColors.brand600 : AppColors.surface,
        border: Border.all(color: AppColors.brand600, width: 2),
      ),
    );
  }
}

/// Honest schedule note: shuttles loop continuously, the live map *is* the
/// timetable — deep-link to it.
class _LiveMapHint extends StatelessWidget {
  const _LiveMapHint({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.brand50,
      borderRadius: AppRadius.brLg,
      child: InkWell(
        borderRadius: AppRadius.brLg,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            border: Border.all(color: AppColors.brand200),
          ),
          child: Row(
            children: [
              const Icon(Icons.map_rounded,
                  size: 22, color: AppColors.brand700),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  'Shuttles loop these routes continuously — no fixed '
                  'timetable. See where they are right now on the live map.',
                  style:
                      AppTypography.caption.copyWith(color: AppColors.brand800),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Icon(Icons.arrow_forward_rounded,
                  size: 18, color: AppColors.brand700),
            ],
          ),
        ),
      ),
    );
  }
}
