import 'dart:convert';

/// The authenticated user, mirroring the backend `User` row (minus
/// password_hash — the API never sends it). See backend/src/types/index.ts.
class AuthUser {
  const AuthUser({
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    this.matricNo,
    this.phone,
  });

  final String userId;
  final String firstName;
  final String lastName;
  final String email;
  final String role;
  final String? matricNo;
  final String? phone;

  String get fullName => '$firstName $lastName'.trim();

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0] : '';
    final l = lastName.isNotEmpty ? lastName[0] : '';
    return (f + l).toUpperCase();
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        userId: json['user_id'] as String,
        firstName: (json['first_name'] as String?) ?? '',
        lastName: (json['last_name'] as String?) ?? '',
        email: (json['email'] as String?) ?? '',
        role: (json['role'] as String?) ?? 'student',
        matricNo: json['matric_no'] as String?,
        phone: json['phone'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'role': role,
        'matric_no': matricNo,
        'phone': phone,
      };

  /// Convenience for TokenStorage, which persists the user as a JSON string.
  String encode() => jsonEncode(toJson());
  static AuthUser decode(String source) =>
      AuthUser.fromJson(jsonDecode(source) as Map<String, dynamic>);
}

/// The `data` payload of a successful register/login: the user plus their JWT.
class AuthResult {
  const AuthResult({required this.user, required this.token});

  final AuthUser user;
  final String token;

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
        user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
        token: json['token'] as String,
      );
}
