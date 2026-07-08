import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'features/auth/state/auth_provider.dart';

void main() {
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
