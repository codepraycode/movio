import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/movio_mark.dart';

/// Shared shell for the login and register screens: an edge-to-edge brand-green
/// header (the live [MovioMark] + a welcome message, drawn under a light status
/// bar) above a textured form area. The whole thing scrolls so the keyboard
/// never covers a field.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.form,
    required this.footer,
    this.onBack,
  });

  final String title;
  final String subtitle;
  final Widget form;
  final Widget footer;

  /// If provided, a back arrow appears in the header (used by Register).
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.light,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: AppBackground(
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Header(title: title, subtitle: subtitle, onBack: onBack),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.page,
                    AppSpacing.xxl,
                    AppSpacing.page,
                    AppSpacing.xxl,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      form,
                      const SizedBox(height: AppSpacing.xxl),
                      footer,
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

class _Header extends StatelessWidget {
  const _Header({required this.title, required this.subtitle, this.onBack});

  final String title;
  final String subtitle;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
        AppSpacing.page,
        topInset + AppSpacing.xl,
        AppSpacing.page,
        AppSpacing.xxxl,
      ),
      decoration: const BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(AppRadius.xl)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (onBack != null)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: _CircleBackButton(onTap: onBack!),
            ),
          Entrance(
            child: const MovioMark(size: 52),
          ),
          const SizedBox(height: AppSpacing.xl),
          Entrance(
            delay: const Duration(milliseconds: 60),
            child: Text(title,
                style: AppTypography.headingLg.copyWith(color: AppColors.onBrand)),
          ),
          const SizedBox(height: AppSpacing.xs),
          Entrance(
            delay: const Duration(milliseconds: 120),
            child: Text(subtitle,
                style: AppTypography.bodyMd.copyWith(color: AppColors.brand100)),
          ),
        ],
      ),
    );
  }
}

class _CircleBackButton extends StatelessWidget {
  const _CircleBackButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkResponse(
      onTap: onTap,
      radius: 24,
      child: Container(
        height: 40,
        width: 40,
        decoration: BoxDecoration(
          color: AppColors.onBrand.withValues(alpha: 0.16),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.arrow_back, color: AppColors.onBrand, size: 20),
      ),
    );
  }
}
