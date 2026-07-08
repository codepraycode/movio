import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';
import 'auth_models.dart';

/// The only place that knows the auth endpoints and their request bodies.
/// Screens/providers call these methods; they never touch HTTP directly.
class AuthRepository {
  AuthRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  /// POST /auth/register. `role` is intentionally omitted — the backend defaults
  /// new self-registrations to `student` (and creates the Transit wallet in the
  /// same transaction). A client shouldn't get to pick its own role.
  Future<AuthResult> register({
    required String matricNo,
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final data = await _client.post(ApiRoutes.register, body: {
      'matric_no': matricNo.trim(),
      'first_name': firstName.trim(),
      'last_name': lastName.trim(),
      'email': email.trim().toLowerCase(),
      'password': password,
      if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
    });
    return AuthResult.fromJson(data);
  }

  /// POST /auth/login.
  Future<AuthResult> login({required String email, required String password}) async {
    final data = await _client.post(ApiRoutes.login, body: {
      'email': email.trim().toLowerCase(),
      'password': password,
    });
    return AuthResult.fromJson(data);
  }
}
