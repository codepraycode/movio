import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_system_ui.dart';
import '../../core/theme/app_typography.dart';
import '../../shared/widgets/app_background.dart';
import '../../shared/widgets/entrance.dart';
import '../../shared/widgets/primary_button.dart';
import '../auth/state/auth_provider.dart';
import 'widgets/onboarding_illustrations.dart';

/// First-run intro. Three slides, each grounded in the real survey findings
/// (see docs/project_brief.md §3): live tracking, cashless tap-to-board, and the
/// smarter-campus/SDG angle. Shown once — `completeOnboarding` persists a flag.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  double _page = 0;
  DateTime? _lastBack;

  static const _slides = <_SlideData>[
    _SlideData(
      illustration: OnboardingIllustration.tracking,
      title: 'Never wait blind again',
      body: "See exactly where your shuttle is and when it'll reach your stop — "
          'live on the map. No more guessing at the bus stop.',
    ),
    _SlideData(
      illustration: OnboardingIllustration.tapToPay,
      title: 'Tap, board, go',
      body: 'Top up your Transit Credit once, then tap to pay for every ride. '
          'No cash, no change wahala.',
    ),
    _SlideData(
      illustration: OnboardingIllustration.smartCampus,
      title: 'Your campus, moving smarter',
      body: 'Secure boarding for FUTA students, and ridership data that helps '
          'run fewer empty trips across campus.',
    ),
  ];

  int get _index => _page.round();
  bool get _isLast => _index == _slides.length - 1;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() => _page = _controller.page ?? 0);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_isLast) {
      context.read<AuthProvider>().completeOnboarding();
    } else {
      _controller.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _skip() => context.read<AuthProvider>().completeOnboarding();

  void _onBack(bool didPop, Object? result) {
    if (didPop) return;
    if (_index > 0) {
      _controller.previousPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
      return;
    }
    final now = DateTime.now();
    if (_lastBack != null && now.difference(_lastBack!) < const Duration(seconds: 2)) {
      Navigator.of(context).maybePop(); // nothing to pop → system handles exit
      return;
    }
    _lastBack = now;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          backgroundColor: AppColors.ink,
          duration: const Duration(seconds: 2),
          content: Text('Press back again to exit',
              style: AppTypography.bodyMd.copyWith(color: AppColors.onBrand)),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: _onBack,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          body: AppBackground(
            child: SafeArea(
              child: Column(
            children: [
              // Skip
              Align(
                alignment: Alignment.centerRight,
                child: AnimatedOpacity(
                  opacity: _isLast ? 0 : 1,
                  duration: const Duration(milliseconds: 200),
                  child: TextButton(
                    onPressed: _isLast ? null : _skip,
                    child: const Text('Skip'),
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _slides.length,
                  itemBuilder: (context, i) {
                    // Parallax: how far this page is from centered (-1..1 nearby).
                    final delta = _page - i;
                    return _Slide(data: _slides[i], parallax: delta);
                  },
                ),
              ),
              _Dots(count: _slides.length, index: _index),
              const SizedBox(height: AppSpacing.xl),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.page, 0, AppSpacing.page, AppSpacing.xl),
                child: PrimaryButton(
                  label: _isLast ? 'Get started' : 'Next',
                  onPressed: _next,
                ),
              ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  }
}

class _SlideData {
  const _SlideData({required this.illustration, required this.title, required this.body});
  final OnboardingIllustration illustration;
  final String title;
  final String body;
}

class _Slide extends StatelessWidget {
  const _Slide({required this.data, required this.parallax});
  final _SlideData data;
  final double parallax;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.page),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Illustration drifts opposite the swipe for depth.
          Transform.translate(
            offset: Offset(parallax * -40, 0),
            child: Opacity(
              opacity: (1 - parallax.abs()).clamp(0.0, 1.0),
              child: OnboardingArt(kind: data.illustration),
            ),
          ),
          const SizedBox(height: AppSpacing.xxxl),
          Entrance(
            child: Text(
              data.title,
              textAlign: TextAlign.center,
              style: AppTypography.headingLg,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Entrance(
            delay: const Duration(milliseconds: 90),
            child: Text(
              data.body,
              textAlign: TextAlign.center,
              style: AppTypography.bodyLg.copyWith(color: AppColors.inkMuted),
            ),
          ),
        ],
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.index});
  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          height: 8,
          width: active ? 24 : 8,
          decoration: BoxDecoration(
            color: active ? AppColors.brand600 : AppColors.line,
            borderRadius: AppRadius.brSm,
          ),
        );
      }),
    );
  }
}
