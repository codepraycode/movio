/// Runtime configuration.
///
/// The physical test phone talks to the backend over the laptop's Wi-Fi LAN IP
/// (NOT `localhost` — that would resolve to the phone itself). The IP changes
/// when you switch networks, so it's injected at build/run time and only falls
/// back to a default for convenience:
///
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.50:4000/api/v1
///
/// Backend must be listening on 0.0.0.0 (Express's default) and reachable from
/// the phone on the same Wi-Fi. Find the laptop IP with `ip addr` / `ipconfig`.
class Env {
  Env._();

  /// Detected LAN IP at scaffold time. Override per-network with --dart-define.
  static const String _defaultBaseUrl = 'http://192.168.218.233:4000/api/v1';

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultBaseUrl,
  );
}

/// Backend REST endpoints, relative to [Env.apiBaseUrl]. Centralised so a path
/// change is a one-line edit, not a hunt across the codebase.
class ApiRoutes {
  ApiRoutes._();

  static const String register = '/auth/register';
  static const String login = '/auth/login';
}
