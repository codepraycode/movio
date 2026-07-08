import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

/// One-liner toasts with a consistent look. Success is brand green; errors use
/// the shared alert-red. Keeps snackbar styling out of individual screens.
class AppSnackbar {
  AppSnackbar._();

  static void success(BuildContext context, String message) =>
      _show(context, message, AppColors.brand700, Icons.check_circle_outline);

  static void error(BuildContext context, String message) =>
      _show(context, message, AppColors.error, Icons.error_outline);

  static void _show(BuildContext context, String message, Color bg, IconData icon) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        backgroundColor: bg,
        content: Row(
          children: [
            Icon(icon, color: AppColors.onBrand, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: AppTypography.bodyMd.copyWith(color: AppColors.onBrand),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
