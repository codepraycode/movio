import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/theme/app_system_ui.dart';
import 'features/auth/state/auth_provider.dart';

void main() {
  // Edge-to-edge: take over the entire screen, including status/nav bars.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  // Default: light status bar with light icons (each screen can override via AnnotatedRegion).
  SystemChrome.setSystemUIOverlayStyle(AppSystemUi.light);

  runApp(
    // Providers are installed above the app so any screen can read auth state.
    // AuthProvider starts in `unknown`; the splash calls bootstrap() to resolve
    // it to authenticated/unauthenticated.
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const MovIOApp(),
    ),
  );
}
