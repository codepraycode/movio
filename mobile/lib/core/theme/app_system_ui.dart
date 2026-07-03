import 'package:flutter/services.dart';

/// Per-screen status-bar styling. Wrap a screen in
/// `AnnotatedRegion<SystemUiOverlayStyle>(value: AppSystemUi.light, child: ...)`
/// and Flutter applies the top-most region's style as you navigate — so the bar
/// stays legible against whatever that screen puts behind it.
///
/// The bar itself is transparent (we draw edge-to-edge); only the icon/text
/// brightness changes.
class AppSystemUi {
  AppSystemUi._();

  /// For dark/green backgrounds (splash, auth header): light icons.
  static const SystemUiOverlayStyle light = SystemUiOverlayStyle(
    statusBarColor: Color(0x00000000),
    statusBarIconBrightness: Brightness.light, // Android
    statusBarBrightness: Brightness.dark, // iOS
    systemNavigationBarColor: Color(0x00000000),
    systemNavigationBarIconBrightness: Brightness.light,
  );

  /// For light/off-white backgrounds (onboarding, home): dark icons.
  static const SystemUiOverlayStyle dark = SystemUiOverlayStyle(
    statusBarColor: Color(0x00000000),
    statusBarIconBrightness: Brightness.dark, // Android
    statusBarBrightness: Brightness.light, // iOS
    systemNavigationBarColor: Color(0x00000000),
    systemNavigationBarIconBrightness: Brightness.dark,
  );
}
