import 'package:flutter/foundation.dart';

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
        _storage = storage ?? TokenStorage();

  final AuthRepository _repo;
  final TokenStorage _storage;

  AuthStatus _status = AuthStatus.unknown;
  AuthUser? _user;
  String? _token;
  bool _onboarded = false; // has the intro been seen on this device?
  bool _submitting = false; // a login/register request is in flight
  String? _errorMessage; // last failure, for the screen to surface

  AuthStatus get status => _status;
  AuthUser? get user => _user;
  String? get token => _token;
  bool get onboarded => _onboarded;
  bool get submitting => _submitting;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

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
    _status = AuthStatus.unauthenticated;
    notifyListeners();
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
