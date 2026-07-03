import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// A soft expanding-and-fading ring behind [child] — MovIO's "this is live"
/// signature (mirrors the admin dashboard's pulse marker). One repeating
/// controller; the ring is a single circle per frame, so it's cheap.
class PulseRing extends StatefulWidget {
  const PulseRing({
    super.key,
    required this.child,
    this.color = AppColors.brand500,
    this.maxRadius = 46,
  });

  final Widget child;
  final Color color;
  final double maxRadius;

  @override
  State<PulseRing> createState() => _PulseRingState();
}

class _PulseRingState extends State<PulseRing> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        AnimatedBuilder(
          animation: _c,
          builder: (context, _) => CustomPaint(
            size: Size.square(widget.maxRadius * 2),
            painter: _RingPainter(_c.value, widget.color),
          ),
        ),
        widget.child,
      ],
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.t, this.color);
  final double t;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final r = size.width / 2 * t;
    final paint = Paint()..color = color.withValues(alpha: (1 - t) * 0.5);
    canvas.drawCircle(center, r, paint);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.t != t;
}
