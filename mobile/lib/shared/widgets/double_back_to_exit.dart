import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_typography.dart';

/// Wrap a top-level screen (one with nothing to pop behind it — login, home,
/// onboarding) so the Android back button/gesture doesn't slam the app shut.
///
/// Behaviour, in order:
///   1. If the keyboard is open, back just dismisses it (fixes "back to hide the
///      keyboard also closed the app").
///   2. Otherwise the first back shows "Press back again to exit"; a second back
///      within 2s actually leaves the app.
///
/// Uses [PopScope] with canPop:false so every back is handed to us to decide.
class DoubleBackToExit extends StatefulWidget {
  const DoubleBackToExit({super.key, required this.child});

  final Widget child;

  @override
  State<DoubleBackToExit> createState() => _DoubleBackToExitState();
}

class _DoubleBackToExitState extends State<DoubleBackToExit> {
  DateTime? _lastBack;

  void _onBack(bool didPop, Object? result) {
    if (didPop) return;

    // 1. Keyboard up? Just close it and stay.
    if (MediaQuery.of(context).viewInsets.bottom > 0) {
      FocusManager.instance.primaryFocus?.unfocus();
      return;
    }

    // 2. Double-press to exit.
    final now = DateTime.now();
    if (_lastBack != null && now.difference(_lastBack!) < const Duration(seconds: 2)) {
      SystemNavigator.pop();
      return;
    }
    _lastBack = now;

    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          backgroundColor: AppColors.ink,
          duration: const Duration(seconds: 2),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.brMd),
          content: Text(
            'Press back again to exit',
            style: AppTypography.bodyMd.copyWith(color: AppColors.onBrand),
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: _onBack,
      child: widget.child,
    );
  }
}
