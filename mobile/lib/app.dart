import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/state/auth_provider.dart';
import 'features/home/home_screen.dart';
import 'features/splash/splash_screen.dart';

/// Root of the app: applies the theme and hands off to [AuthGate].
class MovIOApp extends StatelessWidget {
  const MovIOApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MovIO',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: const AuthGate(),
    );
  }
}

/// Chooses the top-level screen from [AuthProvider.status] — a single, central
/// routing decision, so no individual screen has to navigate on auth changes:
///
///   unknown         → SplashScreen (also runs bootstrap)
///   unauthenticated → Login/Register flow (its own nested Navigator)
///   authenticated   → HomeScreen
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final status = context.watch<AuthProvider>().status;

    final Widget child = switch (status) {
      AuthStatus.unknown => const SplashScreen(),
      AuthStatus.authenticated => const HomeScreen(),
      AuthStatus.unauthenticated => Navigator(
          // A nested Navigator so Login can push Register within this branch.
          // When status flips to authenticated, this whole subtree (and any
          // pushed route) is discarded and HomeScreen takes over cleanly.
          onGenerateRoute: (_) =>
              MaterialPageRoute(builder: (_) => const LoginScreen()),
        ),
    };

    // Gentle cross-fade between the three top-level states.
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: KeyedSubtree(key: ValueKey(status), child: child),
    );
  }
}
