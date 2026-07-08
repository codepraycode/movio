import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../shared/widgets/app_logo.dart';
import '../auth/state/auth_provider.dart';

/// The in-app splash, shown while [AuthProvider.status] is `unknown`.
///
/// Two jobs:
///   1. Play a short brand animation (the mark scales + fades in on the green
///      gradient) — a deliberate first impression, and a seam that hides the
///      hand-off from the OS's native splash.
///   2. Kick off [AuthProvider.bootstrap] (read any stored session). When that
///      finishes, `status` flips and the AuthGate swaps this out for home/login.
/// A minimum on-screen time keeps it from flashing when storage reads instantly.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );

  late final Animation<double> _fade = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOut,
  );
  late final Animation<double> _scale = Tween(begin: 0.82, end: 1.0).animate(
    CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
  );

  @override
  void initState() {
    super.initState();
    _controller.forward();
    // Read context after the first frame — safe place to touch Provider.
    WidgetsBinding.instance.addPostFrameCallback((_) => _boot());
  }

  Future<void> _boot() async {
    // Guarantee the brand moment is seen, then restore any session.
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;
    await context.read<AuthProvider>().bootstrap();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: SafeArea(
          child: Stack(
            children: [
              Center(
                child: FadeTransition(
                  opacity: _fade,
                  child: ScaleTransition(
                    scale: _scale,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const AppLogo.mark(size: 108),
                        const SizedBox(height: AppSpacing.xxl),
                        Text(
                          'MovIO',
                          style: AppTypography.displayLg.copyWith(
                            color: AppColors.onBrand,
                            fontSize: 36,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Smart campus transport · FUTA',
                          style: AppTypography.bodyMd.copyWith(color: AppColors.brand100),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: EdgeInsets.only(bottom: AppSpacing.xxxl),
                  child: SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      valueColor: AlwaysStoppedAnimation(AppColors.onBrand),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
