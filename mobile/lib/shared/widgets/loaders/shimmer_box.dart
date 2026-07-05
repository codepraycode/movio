import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// A skeleton placeholder that shimmers while real content loads — the pattern
/// you'll reuse for the wallet card, trip list, map cards, etc. Prefer this over
/// a spinner when the content's *shape* is known, because a skeleton previews
/// the layout and feels faster.
///
/// How the animation works (worth understanding — it recurs across Flutter):
///   • [AnimationController] repeatedly drives a value from -1 → 2 (vsync ties it
///     to the display refresh so it's smooth and pauses when off-screen).
///   • [AnimatedBuilder] rebuilds only this subtree on each frame.
///   • A [ShaderMask] paints a moving light band (a LinearGradient) across the
///     base grey box; translating its stops each frame is the "shimmer".
///
/// One controller is enough — compose several [ShimmerBox]es for a full skeleton.
class ShimmerBox extends StatefulWidget {
  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.radius = 8,
    this.baseColor,
    this.highlightColor,
  });

  final double width;
  final double height;
  final double radius;

  /// Override the default grey ramp — e.g. white-on-brand for a shimmer that
  /// sits on the green hero. Defaults to the neutral skeleton colours.
  final Color? baseColor;
  final Color? highlightColor;

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose(); // controllers must be released or they leak.
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        // Slide the highlight band across using the animation value.
        final t = _controller.value;
        final base = widget.baseColor ?? AppColors.lineSoft;
        final highlight = widget.highlightColor ?? AppColors.line;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment(-1 + t * 2, 0),
            end: Alignment(1 + t * 2, 0),
            colors: [base, highlight, base],
            stops: const [0.35, 0.5, 0.65],
          ).createShader(bounds),
          child: child,
        );
      },
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: widget.baseColor ?? AppColors.lineSoft,
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}
