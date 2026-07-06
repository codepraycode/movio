import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_radius.dart';
import 'app_typography.dart';

/// Assembles the single light [ThemeData] the whole app runs on.
///
/// Everything a screen needs — colors, text styles, input & button shapes — is
/// defined here once. Widgets then stay declarative: a screen writes
/// `ElevatedButton(...)` or `TextField(...)` and inherits the branded look,
/// instead of restyling from scratch each time.
///
/// Light-only by design: this is used outdoors and in bright lecture halls; a
/// dark theme is a deliberate later decision, not a missing default.
class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand600,
      brightness: Brightness.light,
    ).copyWith(
      primary: AppColors.brand700,
      onPrimary: AppColors.onBrand,
      secondary: AppColors.brand500,
      surface: AppColors.surface,
      onSurface: AppColors.ink,
      error: AppColors.error,
      outline: AppColors.line,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.paper,
      fontFamily: AppTypography.sans,
      splashFactory: InkRipple.splashFactory,

      // One global page transition so every pushed screen opens the same
      // seamless way: a soft fade with a gentle 3% rise instead of the default
      // full-width platform slide. Reads as instant without a jarring swipe.
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: _SeamlessPageTransitionsBuilder(),
          TargetPlatform.iOS: _SeamlessPageTransitionsBuilder(),
        },
      ),

      textTheme: const TextTheme(
        displayLarge: AppTypography.displayLg,
        headlineLarge: AppTypography.headingLg,
        headlineMedium: AppTypography.headingMd,
        titleMedium: AppTypography.titleMd,
        bodyLarge: AppTypography.bodyLg,
        bodyMedium: AppTypography.bodyMd,
        labelLarge: AppTypography.label,
        bodySmall: AppTypography.caption,
      ),

      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.paper,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        foregroundColor: AppColors.ink,
        titleTextStyle: AppTypography.headingMd,
      ),

      // --- Text fields ---------------------------------------------------------
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: AppTypography.bodyMd.copyWith(color: AppColors.inkFaint),
        labelStyle: AppTypography.label.copyWith(color: AppColors.inkMuted),
        floatingLabelStyle: AppTypography.label.copyWith(color: AppColors.brand700),
        errorStyle: AppTypography.caption.copyWith(color: AppColors.error),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: const BorderSide(color: AppColors.brand600, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: const BorderSide(color: AppColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppRadius.brMd,
          borderSide: const BorderSide(color: AppColors.error, width: 1.6),
        ),
      ),

      // --- Buttons -------------------------------------------------------------
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brand600,
          foregroundColor: AppColors.onBrand,
          disabledBackgroundColor: AppColors.brand200,
          disabledForegroundColor: AppColors.onBrand,
          elevation: 0,
          minimumSize: const Size.fromHeight(54),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.brMd),
          textStyle: AppTypography.button,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.brand700,
          textStyle: AppTypography.button.copyWith(fontSize: 14),
        ),
      ),

      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.brLg,
          side: const BorderSide(color: AppColors.line),
        ),
      ),

      dividerTheme: const DividerThemeData(
        color: AppColors.line,
        thickness: 1,
        space: 1,
      ),

      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.brMd),
        contentTextStyle: AppTypography.bodyMd.copyWith(color: AppColors.onBrand),
      ),
    );
  }
}

/// A calm fade + slight upward slide used for every route push (wired via
/// [ThemeData.pageTransitionsTheme]). Cheap to run and consistent across the
/// app, so navigation feels seamless rather than a heavy platform slide.
class _SeamlessPageTransitionsBuilder extends PageTransitionsBuilder {
  const _SeamlessPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.03),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      ),
    );
  }
}
