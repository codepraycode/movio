import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists the auth session across app restarts.
///
/// Uses [FlutterSecureStorage], which on Android is backed by the Keystore
/// (values are encrypted at rest), rather than SharedPreferences (plaintext).
/// A bearer JWT is a credential, so it belongs in secure storage.
class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _kToken = 'movio.jwt';
  static const _kUser = 'movio.user'; // cached user JSON string

  Future<void> saveSession({required String token, required String userJson}) async {
    await _storage.write(key: _kToken, value: token);
    await _storage.write(key: _kUser, value: userJson);
  }

  Future<String?> readToken() => _storage.read(key: _kToken);

  Future<String?> readUserJson() => _storage.read(key: _kUser);

  Future<void> clear() async {
    await _storage.delete(key: _kToken);
    await _storage.delete(key: _kUser);
  }
}
