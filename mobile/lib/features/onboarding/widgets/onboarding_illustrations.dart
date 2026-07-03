import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/pulse_ring.dart';

enum OnboardingIllustration { tracking, tapToPay, smartCampus }

/// Renders the illustration for an onboarding slide. Built from shapes, icons
/// and gradients (no image assets) so it stays crisp and light.
class OnboardingArt extends StatelessWidget {
  const OnboardingArt({super.key, required this.kind});
  final OnboardingIllustration kind;

  @override
  Widget build(BuildContext context) {
    final art = switch (kind) {
      OnboardingIllustration.tracking => const _TrackingArt(),
      OnboardingIllustration.tapToPay => const _TapArt(),
      OnboardingIllustration.smartCampus => const _CampusArt(),
    };
    return SizedBox(height: 260, child: Center(child: art));
  }
}

BoxDecoration _cardDeco({Gradient? gradient, Color? color}) => BoxDecoration(
      color: color,
      gradient: gradient,
      borderRadius: AppRadius.brXl,
      border: color != null ? Border.all(color: AppColors.line) : null,
      boxShadow: [
        BoxShadow(
          color: AppColors.ink.withValues(alpha: 0.08),
          blurRadius: 24,
          offset: const Offset(0, 12),
        ),
      ],
    );

// --- 1. Live tracking: a mini map card with a route + pulsing pin -----------
class _TrackingArt extends StatelessWidget {
  const _TrackingArt();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      height: 200,
      decoration: _cardDeco(color: AppColors.surface),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _RoutePainter())),
          // bus at the start of the route
          const Positioned(
            left: 34,
            bottom: 30,
            child: _Chip(icon: Icons.directions_bus_rounded, color: AppColors.brand600),
          ),
          // pulsing destination pin
          Positioned(
            right: 40,
            top: 34,
            child: PulseRing(
              maxRadius: 34,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(color: AppColors.brand700, shape: BoxShape.circle),
                child: const Icon(Icons.location_on, color: AppColors.onBrand, size: 20),
              ),
            ),
          ),
          Positioned(
            left: 16,
            top: 14,
            child: Text('ETA 4 min',
                style: AppTypography.dataMd.copyWith(color: AppColors.brand700)),
          ),
        ],
      ),
    );
  }
}

class _RoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // faint map grid
    final grid = Paint()..color = AppColors.line.withValues(alpha: 0.5)..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 34) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (double y = 0; y < size.height; y += 34) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    // route path from bus (bottom-left) to pin (top-right)
    final path = Path()
      ..moveTo(52, size.height - 40)
      ..cubicTo(90, size.height - 40, 120, 70, size.width - 56, 60);
    canvas.drawPath(
      path,
      Paint()
        ..color = AppColors.brand500
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RoutePainter old) => false;
}

// --- 2. Tap to pay: a Transit Credit card ------------------------------------
class _TapArt extends StatelessWidget {
  const _TapArt();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 280,
      height: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // faint card behind, for depth
          Transform.rotate(
            angle: -0.10,
            child: Container(
              width: 250,
              height: 158,
              decoration: _cardDeco(color: AppColors.brand100),
            ),
          ),
          Container(
            width: 262,
            height: 168,
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: _cardDeco(gradient: AppColors.brandGradient),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Transit Credit',
                        style: AppTypography.label.copyWith(color: AppColors.onBrand)),
                    const Icon(Icons.contactless_rounded, color: AppColors.onBrand, size: 24),
                  ],
                ),
                const Spacer(),
                Text('₦ 1,500',
                    style: AppTypography.dataXl.copyWith(color: AppColors.onBrand, fontSize: 30)),
                const SizedBox(height: AppSpacing.sm),
                Text('Tap to board  ····  8842',
                    style: AppTypography.dataMd.copyWith(color: AppColors.brand100)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- 3. Smart campus: a stop network + eco note ------------------------------
class _CampusArt extends StatelessWidget {
  const _CampusArt();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      height: 200,
      decoration: _cardDeco(color: AppColors.surface),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _NetworkPainter())),
          Positioned(
            right: 16,
            top: 14,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(color: AppColors.brand600, shape: BoxShape.circle),
              child: const Icon(Icons.verified, color: AppColors.onBrand, size: 22),
            ),
          ),
          Positioned(
            left: 16,
            bottom: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: AppColors.brand50, borderRadius: AppRadius.brSm),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.eco, color: AppColors.brand700, size: 16),
                  const SizedBox(width: 6),
                  Text('fewer empty trips',
                      style: AppTypography.caption.copyWith(color: AppColors.brand700)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NetworkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final nodes = [
      Offset(size.width * 0.22, size.height * 0.30),
      Offset(size.width * 0.50, size.height * 0.55),
      Offset(size.width * 0.78, size.height * 0.32),
      Offset(size.width * 0.40, size.height * 0.80),
      Offset(size.width * 0.72, size.height * 0.72),
    ];
    final edges = [
      [0, 1], [1, 2], [1, 3], [1, 4], [3, 4],
    ];
    final line = Paint()
      ..color = AppColors.brand300
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    for (final e in edges) {
      canvas.drawLine(nodes[e[0]], nodes[e[1]], line);
    }
    for (final n in nodes) {
      canvas.drawCircle(n, 7, Paint()..color = AppColors.surface);
      canvas.drawCircle(n, 7, Paint()
        ..color = AppColors.brand600
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3);
    }
  }

  @override
  bool shouldRepaint(_NetworkPainter old) => false;
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.color});
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(9),
      decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: [
        BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 12, offset: const Offset(0, 4)),
      ]),
      child: Icon(icon, color: AppColors.onBrand, size: 20),
    );
  }
}
