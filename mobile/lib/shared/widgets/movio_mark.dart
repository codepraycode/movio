import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// The MovIO map-pin "M" mark, drawn in code from its true vector geometry
/// (the same path as the brand's icon.svg) rather than a raster PNG.
///
/// Why a painter instead of an Image:
///   • pixel-sharp at any size, no export/scaling artifacts;
///   • [progress] can animate the stroke *drawing itself* (0 → 1) for the splash;
///   • recolours for free (white on green, or the green gradient on light).
///
/// Cheap to paint (a few line segments + two circles), so it's fine to animate.
class MovioMark extends StatelessWidget {
  const MovioMark({
    super.key,
    this.size = 96,
    this.showBackground = true,
    this.strokeColor = AppColors.onBrand,
    this.progress = 1.0,
  });

  /// Side length of the (square) mark.
  final double size;

  /// Draw the rounded green-gradient tile behind the M (the app-icon look).
  /// Set false to drop just the M onto whatever surface you're on.
  final bool showBackground;

  /// Colour of the M strokes (default white, for on-green use).
  final Color strokeColor;

  /// 0 → 1 stroke-draw progress. 1 = fully drawn (the normal static state).
  final double progress;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _MovioMarkPainter(
          showBackground: showBackground,
          strokeColor: strokeColor,
          progress: progress.clamp(0.0, 1.0),
        ),
      ),
    );
  }
}

class _MovioMarkPainter extends CustomPainter {
  _MovioMarkPainter({
    required this.showBackground,
    required this.strokeColor,
    required this.progress,
  });

  final bool showBackground;
  final Color strokeColor;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    // Everything is authored in the original 40x40 viewBox, then scaled.
    final f = size.width / 40.0;

    if (showBackground) {
      final rect = Offset.zero & size;
      final bg = Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.brand500, AppColors.brand700],
        ).createShader(rect);
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, Radius.circular(11 * f)),
        bg,
      );
    }

    // The M: (10,29)->(10,14)->(20,24)->(30,14)->(30,29).
    final path = Path()
      ..moveTo(10 * f, 29 * f)
      ..lineTo(10 * f, 14 * f)
      ..lineTo(20 * f, 24 * f)
      ..lineTo(30 * f, 14 * f)
      ..lineTo(30 * f, 29 * f);

    final stroke = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.2 * f
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // Draw only the leading `progress` fraction of the path's length.
    if (progress >= 1.0) {
      canvas.drawPath(path, stroke);
    } else if (progress > 0) {
      final metric = path.computeMetrics().first;
      canvas.drawPath(metric.extractPath(0, metric.length * progress), stroke);
    }

    // The pin node at the middle vertex (20,24) — fades/scales in at the end,
    // so it "lands" just as the strokes finish drawing.
    final pinT = ((progress - 0.8) / 0.2).clamp(0.0, 1.0);
    if (pinT > 0) {
      final center = Offset(20 * f, 24 * f);
      canvas.drawCircle(
        center,
        3.4 * f * pinT,
        Paint()..color = strokeColor,
      );
      canvas.drawCircle(
        center,
        1.7 * f * pinT,
        Paint()..color = AppColors.brand700,
      );
    }
  }

  @override
  bool shouldRepaint(_MovioMarkPainter old) =>
      old.progress != progress ||
      old.strokeColor != strokeColor ||
      old.showBackground != showBackground;
}
