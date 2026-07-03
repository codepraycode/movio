import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_system_ui.dart';
import '../../core/theme/app_typography.dart';
import '../../shared/widgets/movio_mark.dart';
import '../auth/state/auth_provider.dart';

/// Brand splash shown while [AuthProvider.status] is `unknown`.
///
/// The white "M" draws itself over the green gradient, the pin lands, then the
/// wordmark + tagline rise in — a single controller driving three overlapping
/// intervals. Meanwhile [_boot] restores any saved session; when it finishes,
/// `status` flips and the AuthGate swaps us out for onboarding/login/home.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1700),
  );

  // Overlapping phases carved out of the one controller.
  late final Animation<double> _draw =
      CurvedAnimation(parent: _c, curve: const Interval(0.0, 0.62, curve: Curves.easeInOut));
  late final Animation<double> _text =
      CurvedAnimation(parent: _c, curve: const Interval(0.55, 1.0, curve: Curves.easeOut));

  @override
  void initState() {
    super.initState();
    _c.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) => _boot());
  }

  Future<void> _boot() async {
    await Future.delayed(const Duration(milliseconds: 1650));
    if (!mounted) return;
    await context.read<AuthProvider>().bootstrap();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.light,
      child: Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        child: SafeArea(
          child: Center(
            child: AnimatedBuilder(
              animation: _c,
              builder: (context, _) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MovioMark(
                      size: 116,
                      showBackground: false,
                      strokeColor: AppColors.onBrand,
                      progress: _draw.value,
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    Opacity(
                      opacity: _text.value,
                      child: Transform.translate(
                        offset: Offset(0, 12 * (1 - _text.value)),
                        child: Column(
                          children: [
                            Text(
                              'MovIO',
                              style: AppTypography.displayLg.copyWith(
                                color: AppColors.onBrand,
                                fontSize: 40,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              'Smart campus transport',
                              style: AppTypography.bodyMd.copyWith(color: AppColors.brand100),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
      ),
    );
  }
}
