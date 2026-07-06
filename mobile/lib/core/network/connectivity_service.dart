import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// App-wide connectivity state (MOB-9).
///
/// Wraps `connectivity_plus` and exposes a single boolean, [isOnline], plus
/// [notifyListeners] on every transition so a global banner can react. This
/// reports whether the phone *has a network interface* (Wi-Fi / mobile / etc.),
/// which is what "the user turned Wi-Fi off" looks like — not a guarantee the
/// backend is reachable. Real server-unreachable failures are still caught in
/// [ApiClient] and shown as a friendly message, so the two layers complement
/// each other rather than overlap.
class ConnectivityProvider extends ChangeNotifier {
  ConnectivityProvider({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity() {
    _init();
  }

  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _sub;

  // Start optimistic: assume online until the first check resolves, so the app
  // doesn't flash an "offline" banner during a normal cold start.
  bool _isOnline = true;
  bool get isOnline => _isOnline;

  Future<void> _init() async {
    try {
      _apply(await _connectivity.checkConnectivity());
    } catch (_) {
      // If the platform check fails, stay optimistic rather than block the UI.
    }
    _sub = _connectivity.onConnectivityChanged.listen(
      _apply,
      onError: (_) {},
    );
  }

  /// A phone is "online" if it has any interface other than `none`. We don't try
  /// to distinguish Wi-Fi vs mobile here — any usable link counts.
  void _apply(List<ConnectivityResult> results) {
    final online = results.isNotEmpty &&
        results.any((r) => r != ConnectivityResult.none);
    if (online == _isOnline) return;
    _isOnline = online;
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
