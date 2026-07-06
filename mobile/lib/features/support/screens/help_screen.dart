import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/screen_header.dart';
import '../../complaints/screens/complaint_screen.dart';

/// Help & Support: a short FAQ plus the real way to get help — the in-app
/// "Report an issue" flow (which reaches campus transport staff). We don't
/// hardcode a support phone/email here because none is confirmed yet; the
/// complaint flow is the honest, working support channel today.
class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  static const _faqs = <(String, String)>[
    (
      'What is Transit Credit?',
      'It’s a prepaid count of trips — one credit is used each time you board. '
          'It is a ride count, not money.',
    ),
    (
      'How do I board a shuttle?',
      'Open “Board a trip”, then hold your phone to the shuttle’s TapTrace '
          'reader. One credit is deducted automatically.',
    ),
    (
      'The live map is empty or a bus isn’t moving.',
      'Live positions depend on the shuttle’s device and the campus network, so '
          'they can be delayed or briefly unavailable. Pull to refresh, or check '
          'again shortly.',
    ),
    (
      'I was charged but didn’t board (or vice-versa).',
      'Use “Report an issue” below with the trip details and it will be '
          'reviewed by campus transport staff.',
    ),
  ];

  void _report(BuildContext context) {
    HapticFeedback.selectionClick();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ComplaintScreen()),
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
                const ScreenHeader(title: 'Help & Support'),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(AppSpacing.page),
                    children: [
                      Text('Frequently asked', style: AppTypography.titleMd),
                      const SizedBox(height: AppSpacing.md),
                      for (final (q, a) in _faqs) ...[
                        _FaqCard(question: q, answer: a),
                        const SizedBox(height: AppSpacing.md),
                      ],
                      const SizedBox(height: AppSpacing.lg),
                      Text('Still need help?', style: AppTypography.titleMd),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Report a problem and it goes straight to campus '
                        'transport staff, linked to your trip if you pick one.',
                        style: AppTypography.bodyMd
                            .copyWith(color: AppColors.inkMuted),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      _ReportButton(onTap: () => _report(context)),
                      const SizedBox(height: AppSpacing.xl),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FaqCard extends StatelessWidget {
  const _FaqCard({required this.question, required this.answer});

  final String question;
  final String answer;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: AppColors.line),
      ),
      child: Theme(
        // Strip the default ExpansionTile dividers so it sits cleanly in the card.
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          shape: const Border(),
          tilePadding:
              const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          childrenPadding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.lg),
          iconColor: AppColors.brand700,
          collapsedIconColor: AppColors.inkFaint,
          title: Text(question, style: AppTypography.bodyMd),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                answer,
                style:
                    AppTypography.bodyMd.copyWith(color: AppColors.inkMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportButton extends StatelessWidget {
  const _ReportButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.brand600,
      borderRadius: AppRadius.brMd,
      child: InkWell(
        borderRadius: AppRadius.brMd,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.flag_outlined,
                  size: 19, color: AppColors.onBrand),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Report an issue',
                style:
                    AppTypography.button.copyWith(color: AppColors.onBrand),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
