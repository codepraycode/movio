import 'package:flutter/material.dart';

/// The MovIO logo, in its two supplied forms. Centralised so asset paths and
/// sizing live in one place.
///
///  • [AppLogo.mark]     — the square "M" icon (good on the brand-green surfaces
///                         like the splash; the rounded square gives its own
///                         contrast).
///  • [AppLogo.wordmark] — the horizontal "Movio" lockup (for light headers such
///                         as login/register).
class AppLogo extends StatelessWidget {
  const AppLogo._({required this.asset, this.size, this.height, this.semantic, super.key});

  final String asset;
  final double? size;
  final double? height;
  final String? semantic;

  static const _markAsset = 'assets/images/movio-icon.png';
  static const _wordmarkAsset = 'assets/images/movio-logo.png';

  const AppLogo.mark({Key? key, double size = 96})
      : this._(asset: _markAsset, size: size, semantic: 'MovIO', key: key);

  const AppLogo.wordmark({Key? key, double height = 40})
      : this._(asset: _wordmarkAsset, height: height, semantic: 'MovIO', key: key);

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      asset,
      width: size,
      height: size ?? height,
      fit: BoxFit.contain,
      semanticLabel: semantic,
    );
  }
}
