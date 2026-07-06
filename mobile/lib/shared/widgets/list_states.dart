import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import 'loaders/shimmer_box.dart';

/// Shimmer placeholder list shown while a list screen loads its first page.
class ListLoading extends StatelessWidget {
  const ListLoading({super.key, this.itemHeight = 118, this.itemCount = 5});

  final double itemHeight;
  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.page),
      itemCount: itemCount,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (_, _) =>
          ShimmerBox(width: double.infinity, height: itemHeight, radius: 16),
    );
  }
}

/// Full-height empty/error state for list screens that keeps pull-to-refresh
/// working (the ListView must always be scrollable for RefreshIndicator).
class ListMessage extends StatelessWidget {
  const ListMessage({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    required this.onRefresh,
  });

  final IconData icon;
  final String title;
  final String body;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.brand600,
      backgroundColor: AppColors.surface,
      child: LayoutBuilder(
        builder: (context, constraints) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: constraints.maxHeight,
              child: Center(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.xxxl),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        height: 72,
                        width: 72,
                        decoration: const BoxDecoration(
                          color: AppColors.brand50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, size: 32, color: AppColors.brand700),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(title,
                          textAlign: TextAlign.center,
                          style: AppTypography.titleMd),
                      const SizedBox(height: AppSpacing.sm),
                      Text(body,
                          textAlign: TextAlign.center,
                          style: AppTypography.caption),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
