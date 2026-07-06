import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_models.dart';
import '../data/auth_repository.dart';

/// Coarse app-level auth state — decides *which* screen the app shows.
enum AuthStatus {
  /// Startup: we haven't checked storage yet. The splash shows during this.
  unknown,

  /// A valid session was found / created.
  authenticated,

  /// No session — show login/register.
  unauthenticated,
}

/// Single source of truth for authentication.
///
/// A [ChangeNotifier]: it holds state and calls [notifyListeners] whenever that
/// state changes; widgets that `watch` it rebuild. Screens call [login] /
/// [register] / [logout]; the splash calls [bootstrap] once at startup.
class AuthProvider extends ChangeNotifier {
  AuthProvider({AuthRepository? repository, TokenStorage? storage})
      : _repo = repository ?? AuthRepository(),
        _storage = storage ?? TokenStorage() {
    // Self-register the 401 hook so any expired-token response from any feature's
    // ApiClient routes back here to sign out cleanly. Single AuthProvider, so a
    // single static callback is enough.
    ApiClient.onUnauthorized = handleUnauthorized;
  }

  final AuthRepository _repo;
  final TokenStorage _storage;

  AuthStatus _status = AuthStatus.unknown;
  AuthUser? _user;
  String? _token;
  bool _onboarded = false; // has the intro been seen on this device?
  bool _submitting = false; // a login/register request is in flight
  String? _errorMessage; // last failure, for the screen to surface
  bool _sessionExpired = false; // set when a 401 forced a logout mid-session

  AuthStatus get status => _status;
  AuthUser? get user => _user;
  String? get token => _token;
  bool get onboarded => _onboarded;
  bool get submitting => _submitting;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  /// True once between an expiry-triggered logout and the login screen showing
  /// its notice. The login screen reads this, tells the user, then calls
  /// [acknowledgeSessionExpired] so it only surfaces once.
  bool get sessionExpired => _sessionExpired;

  /// Read any persisted session at startup. Because the JWT lives in secure
  /// storage, a returning student skips the login screen entirely.
  Future<void> bootstrap() async {
    _onboarded = await _storage.readOnboarded();
    final token = await _storage.readToken();
    final userJson = await _storage.readUserJson();
    if (token != null && token.isNotEmpty && userJson != null) {
      _token = token;
      _user = AuthUser.decode(userJson);
      _status = AuthStatus.authenticated;
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  /// Called when the student finishes (or skips) the intro. Persisted so it
  /// never replays, then routes on to login.
  Future<void> completeOnboarding() async {
    _onboarded = true;
    await _storage.setOnboarded();
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) {
    return _run(() => _repo.login(email: email, password: password));
  }

  Future<bool> register({
    required String matricNo,
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) {
    return _run(() => _repo.register(
          matricNo: matricNo,
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
          phone: phone,
        ));
  }

  Future<void> logout() async {
    await _storage.clear();
    _token = null;
    _user = null;
    _sessionExpired = false;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  /// Called (via [ApiClient.onUnauthorized]) when an authenticated request comes
  /// back 401 — the JWT has expired or been revoked. Drops the session and flags
  /// [sessionExpired] so login can explain why the user is back at the door.
  /// No-ops if we're already signed out, so a burst of failing calls only logs
  /// out once.
  void handleUnauthorized() {
    if (_status != AuthStatus.authenticated) return;
    _sessionExpired = true;
    _token = null;
    _user = null;
    _status = AuthStatus.unauthenticated;
    // Fire-and-forget: clearing storage needn't block the state flip.
    _storage.clear();
    notifyListeners();
  }

  /// Login screen calls this after it has shown the "session expired" notice, so
  /// the message doesn't reappear on the next rebuild.
  void acknowledgeSessionExpired() {
    _sessionExpired = false;
  }

  /// Shared submit path for login/register: toggles [submitting], persists the
  /// session on success (flipping [status] to authenticated → the app navigates
  /// into home), and captures a friendly [errorMessage] on failure.
  /// Returns true on success.
  Future<bool> _run(Future<AuthResult> Function() action) async {
    _submitting = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await action();
      await _storage.saveSession(
        token: result.token,
        userJson: result.user.encode(),
      );
      _token = result.token;
      _user = result.user;
      _status = AuthStatus.authenticated;
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (_) {
      _errorMessage = 'Something went wrong. Please try again.';
      return false;
    } finally {
      _submitting = false;
      notifyListeners();
    }
  }
}
