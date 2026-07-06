import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/screen_header.dart';
import '../../auth/state/auth_provider.dart';
import '../../trips/data/trips_history_repository.dart';
import '../data/complaints_repository.dart';

/// Complaint submission (PSD-105, MOB-7 → BE-8's `POST /complaints`).
///
/// Required description + an *optional* trip reference: instead of asking a
/// student for a trip UUID, we load their recent boardings and let them pick
/// one from a bottom sheet. If that list can't load (offline, no trips yet)
/// the picker quietly disappears — a complaint must never be blocked by an
/// optional nicety.
class ComplaintScreen extends StatefulWidget {
  const ComplaintScreen({super.key});

  @override
  State<ComplaintScreen> createState() => _ComplaintScreenState();
}

class _ComplaintScreenState extends State<ComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _description = TextEditingController();
  final ComplaintsRepository _repo = ComplaintsRepository();
  final TripsHistoryRepository _tripsRepo = TripsHistoryRepository();

  List<BoardedTrip> _recentTrips = const [];
  BoardedTrip? _linkedTrip;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadRecentTrips();
  }

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  Future<void> _loadRecentTrips() async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;
    try {
      final trips = await _tripsRepo.myTrips(token);
      if (mounted) setState(() => _recentTrips = trips.take(10).toList());
    } catch (_) {
      // Optional feature: no trips picker is a fine outcome, never an error.
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final token = context.read<AuthProvider>().token;
    if (token == null) return;

    setState(() => _submitting = true);
    try {
      await _repo.submit(
        token,
        description: _description.text.trim(),
        tripId: _linkedTrip?.tripId,
      );
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      Navigator.of(context).pop();
      AppSnackbar.success(
          context, 'Report sent — the transport office will review it');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      AppSnackbar.error(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitting = false);
      AppSnackbar.error(context, 'Something went wrong — please try again');
    }
  }

  Future<void> _pickTrip() async {
    HapticFeedback.selectionClick();
    final picked = await showModalBottomSheet<BoardedTrip>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (_) => _TripPickerSheet(trips: _recentTrips),
    );
    if (picked != null && mounted) setState(() => _linkedTrip = picked);
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        resizeToAvoidBottomInset: true,
        body: AppBackground(
          child: SafeArea(
            child: Column(
              children: [
                const ScreenHeader(title: 'Report an issue'),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.page),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Entrance(
                            child: Text(
                              'Tell the transport office what happened — a '
                              'late shuttle, a boarding problem, anything.',
                              style: AppTypography.bodyMd
                                  .copyWith(color: AppColors.inkMuted),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xl),
                          Entrance(
                            delay: const Duration(milliseconds: 60),
                            child: _buildDescriptionField(),
                          ),
                          const SizedBox(height: AppSpacing.xl),
                          if (_recentTrips.isNotEmpty)
                            Entrance(
                              delay: const Duration(milliseconds: 120),
                              child: _buildTripLink(),
                            ),
                          const SizedBox(height: AppSpacing.xxl),
                          Entrance(
                            delay: const Duration(milliseconds: 180),
                            child: SizedBox(
                              width: double.infinity,
                              child: PrimaryButton(
                                label: 'Send report',
                                icon: Icons.send_rounded,
                                loading: _submitting,
                                onPressed: _submit,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDescriptionField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('What happened?', style: AppTypography.label),
        const SizedBox(height: AppSpacing.sm),
        TextFormField(
          controller: _description,
          maxLines: 5,
          minLines: 4,
          maxLength: 500,
          textCapitalization: TextCapitalization.sentences,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          style: AppTypography.bodyLg,
          decoration: const InputDecoration(
            hintText: 'e.g. Bus arrived 20 minutes late at South Gate',
          ),
          validator: (v) => (v == null || v.trim().isEmpty)
              ? 'Please describe what happened'
              : null,
        ),
      ],
    );
  }

  /// Optional trip reference: unset shows a "link a trip" affordance; set
  /// shows the chosen trip with a clear (X) action.
  Widget _buildTripLink() {
    final linked = _linkedTrip;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Link a trip', style: AppTypography.label),
            const SizedBox(width: AppSpacing.sm),
            Text('optional', style: AppTypography.caption),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Material(
          color: linked == null ? AppColors.surface : AppColors.brand50,
          borderRadius: AppRadius.brMd,
          child: InkWell(
            borderRadius: AppRadius.brMd,
            onTap: _pickTrip,
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                borderRadius: AppRadius.brMd,
                border: Border.all(
                    color: linked == null ? AppColors.line : AppColors.brand200),
              ),
              child: linked == null
                  ? Row(
                      children: [
                        const Icon(Icons.directions_bus_rounded,
                            size: 20, color: AppColors.inkMuted),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Text('Pick one of your recent trips',
                              style: AppTypography.bodyMd
                                  .copyWith(color: AppColors.inkMuted)),
                        ),
                        const Icon(Icons.expand_more_rounded,
                            size: 20, color: AppColors.inkFaint),
                      ],
                    )
                  : Row(
                      children: [
                        const Icon(Icons.directions_bus_rounded,
                            size: 20, color: AppColors.brand700),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                linked.routeName ?? linked.plateNumber,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.titleMd,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${linked.plateNumber} · ${formatDayTime(linked.boardedAt)}',
                                style: AppTypography.caption.copyWith(
                                    fontFamily: AppTypography.mono),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => setState(() => _linkedTrip = null),
                          icon: const Icon(Icons.close_rounded,
                              size: 18, color: AppColors.inkMuted),
                          tooltip: 'Remove trip link',
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom sheet listing the student's recent boardings to reference.
class _TripPickerSheet extends StatelessWidget {
  const _TripPickerSheet({required this.trips});

  final List<BoardedTrip> trips;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.page, AppSpacing.xl, AppSpacing.page, AppSpacing.sm),
            child: Text('Which trip was it?', style: AppTypography.headingMd),
          ),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              itemCount: trips.length,
              separatorBuilder: (_, _) =>
                  const Divider(height: 1, color: AppColors.lineSoft),
              itemBuilder: (context, i) {
                final t = trips[i];
                return ListTile(
                  onTap: () => Navigator.of(context).pop(t),
                  leading: Container(
                    height: 40,
                    width: 40,
                    decoration: BoxDecoration(
                      color: AppColors.brand50,
                      borderRadius: AppRadius.brMd,
                    ),
                    child: const Icon(Icons.directions_bus_rounded,
                        size: 20, color: AppColors.brand700),
                  ),
                  title: Text(
                    t.routeName ?? t.plateNumber,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.titleMd,
                  ),
                  subtitle: Text(
                    '${t.plateNumber} · ${formatDayTime(t.boardedAt)}',
                    style: AppTypography.caption
                        .copyWith(fontFamily: AppTypography.mono),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
