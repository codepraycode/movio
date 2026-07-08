import 'package:flutter/material.dart';

/// MovIO student-app color tokens.
///
/// The brand is GREEN — the map-pin "M" logo and the ramp the developer supplied
/// in assets/css/style.css. (The admin dashboard deliberately uses a utilitarian
/// blue instead; that's a separate surface. Don't reintroduce blue here.)
///
/// These are raw tokens. Screens should almost never reference this class
/// directly — they read finished roles off `Theme.of(context).colorScheme` and
/// the text theme, which `AppTheme` builds from these values. Keeping the tokens
/// in one place means a rebrand is a one-file change.
class AppColors {
  AppColors._();

  // --- Brand ramp (green). Verbatim from assets/css/style.css -----------------
  static const Color brand50 = Color(0xFFECFDF5);
  static const Color brand100 = Color(0xFFD1FAE5);
  static const Color brand200 = Color(0xFFA7F3D0);
  static const Color brand300 = Color(0xFF6EE7B7);
  static const Color brand400 = Color(0xFF34D399);
  static const Color brand500 = Color(0xFF22C55E); // logo gradient — light stop
  static const Color brand600 = Color(0xFF16A34A); // primary CTA fill
  static const Color brand700 = Color(0xFF0F7A52); // primary brand / headings on light
  static const Color brand800 = Color(0xFF115E3F);
  static const Color brand900 = Color(0xFF134E35); // logo gradient — dark stop

  /// Signature hero gradient (splash, auth header, wallet card). Matches the
  /// diagonal gradient baked into the logo mark itself.
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand500, brand700],
  );

  // --- Neutrals. Warm, shared with the dashboard family for cross-surface
  //     coherence (ink/paper/surface/line) --------------------------------------
  static const Color ink = Color(0xFF101828); // primary text / headers
  static const Color inkMuted = Color(0xFF667085); // secondary text
  static const Color inkFaint = Color(0xFF98A2B3); // hints, disabled, captions
  static const Color paper = Color(0xFFFAFAF8); // warm off-white base background
  static const Color surface = Color(0xFFFFFFFF); // cards / sheets on paper
  static const Color line = Color(0xFFE4E4E1); // borders, dividers
  static const Color lineSoft = Color(0xFFF0F0EE); // very subtle fills / disabled bg

  // --- Semantic. Each means one thing, so state reads at a glance -------------
  /// Success reuses the brand green (money in, boarded, topped up — all "good").
  static const Color success = brand600;
  static const Color warning = Color(0xFFF59E0B); // matches dashboard signal-amber
  static const Color error = Color(0xFFD9483C); // matches dashboard alert-red
  static const Color onBrand = Color(0xFFFFFFFF); // text/icons on a brand fill
}
