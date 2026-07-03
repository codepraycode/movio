import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// The app's ambient background — a warm off-white base, two soft green glows
/// bleeding in from opposite corners, and a faint dot grid for texture. Gives
/// the screens a youthful, "mobility brand" feel instead of flat white.
///
/// Painted once and static (no animation), so it's essentially free. Put content
/// as [child]; keep cards on `surface` white so they lift off this texture.
class AppBackground extends StatelessWidget {
  const AppBackground({super.key, required this.child, this.showGlow = true});

  final Widget child;
  final bool showGlow;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: AppColors.paper),
      child: Stack(
        children: [
          if (showGlow) ...[
            const Positioned(top: -130, right: -110, child: _Glow(color: AppColors.brand300, size: 300)),
            const Positioned(bottom: -160, left: -130, child: _Glow(color: AppColors.brand200, size: 340)),
          ],
          Positioned.fill(
            child: CustomPaint(painter: _DotTexture()),
          ),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.color, required this.size});
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color.withValues(alpha: 0.28), color.withValues(alpha: 0.0)],
          ),
        ),
      ),
    );
  }
}

class _DotTexture extends CustomPainter {
  static const _gap = 26.0;
  static const _radius = 1.3;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.ink.withValues(alpha: 0.035);
    for (double y = _gap; y < size.height; y += _gap) {
      for (double x = _gap; x < size.width; x += _gap) {
        canvas.drawCircle(Offset(x, y), _radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DotTexture old) => false;
}
