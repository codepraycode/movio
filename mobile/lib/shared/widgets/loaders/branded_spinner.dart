import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

/// The app's standard indeterminate loader: a brand-green circular indicator,
/// with an optional caption. Use for full-screen / blocking waits (e.g. the
/// splash bootstrap). For content that has a known shape, prefer [ShimmerBox].
class BrandedSpinner extends StatelessWidget {
  const BrandedSpinner({super.key, this.label, this.size = 32});

  final String? label;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: size,
          width: size,
          child: const CircularProgressIndicator(
            strokeWidth: 3,
            valueColor: AlwaysStoppedAnimation(AppColors.brand600),
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: AppSpacing.lg),
          Text(label!, style: AppTypography.caption),
        ],
      ],
    );
  }
}
