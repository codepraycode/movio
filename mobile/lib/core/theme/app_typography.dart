import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Type scale for the MovIO app.
///
/// Two families, on purpose (same reasoning as the admin dashboard):
///   • IBM Plex Sans  — all UI text, labels, prose.
///   • IBM Plex Mono  — anything that is *real machine data*: wallet credit
///     figures, matric numbers, trip IDs, NFC UIDs, ETAs. Setting telemetry in
///     mono makes "this is actual data" legible at a glance.
///
/// Families are declared in pubspec.yaml; the .ttf files live in assets/fonts/.
/// If those files aren't present yet the app still runs — text falls back to the
/// platform default until they're dropped in.
class AppTypography {
  AppTypography._();

  static const String sans = 'IBM Plex Sans';
  static const String mono = 'IBM Plex Mono';

  // --- Display / headings -----------------------------------------------------
  static const TextStyle displayLg = TextStyle(
    fontFamily: sans,
    fontSize: 32,
    height: 1.15,
    fontWeight: FontWeight.w700,
    color: AppColors.ink,
    letterSpacing: -0.5,
  );

  static const TextStyle headingLg = TextStyle(
    fontFamily: sans,
    fontSize: 24,
    height: 1.2,
    fontWeight: FontWeight.w700,
    color: AppColors.ink,
    letterSpacing: -0.3,
  );

  static const TextStyle headingMd = TextStyle(
    fontFamily: sans,
    fontSize: 20,
    height: 1.25,
    fontWeight: FontWeight.w600,
    color: AppColors.ink,
  );

  static const TextStyle titleMd = TextStyle(
    fontFamily: sans,
    fontSize: 16,
    height: 1.3,
    fontWeight: FontWeight.w600,
    color: AppColors.ink,
  );

  // --- Body -------------------------------------------------------------------
  static const TextStyle bodyLg = TextStyle(
    fontFamily: sans,
    fontSize: 16,
    height: 1.45,
    fontWeight: FontWeight.w400,
    color: AppColors.ink,
  );

  static const TextStyle bodyMd = TextStyle(
    fontFamily: sans,
    fontSize: 14,
    height: 1.45,
    fontWeight: FontWeight.w400,
    color: AppColors.ink,
  );

  static const TextStyle label = TextStyle(
    fontFamily: sans,
    fontSize: 14,
    height: 1.3,
    fontWeight: FontWeight.w500,
    color: AppColors.ink,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: sans,
    fontSize: 12,
    height: 1.35,
    fontWeight: FontWeight.w400,
    color: AppColors.inkMuted,
  );

  static const TextStyle button = TextStyle(
    fontFamily: sans,
    fontSize: 16,
    height: 1.2,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
  );

  // --- Mono (data) ------------------------------------------------------------
  /// Big monetary/credit figures (e.g. a wallet balance).
  static const TextStyle dataXl = TextStyle(
    fontFamily: mono,
    fontSize: 34,
    height: 1.1,
    fontWeight: FontWeight.w500,
    color: AppColors.ink,
  );

  /// Inline data: matric no, IDs, UIDs, coordinates.
  static const TextStyle dataMd = TextStyle(
    fontFamily: mono,
    fontSize: 14,
    height: 1.3,
    fontWeight: FontWeight.w400,
    color: AppColors.ink,
  );
}
