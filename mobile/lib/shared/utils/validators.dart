/// Form field validators.
///
/// Each returns `null` when the value is acceptable, or an error string to
/// display — the exact contract Flutter's `TextFormField.validator` expects.
/// Client-side rules mirror the backend DTOs (auth.types.ts) so most bad input
/// is caught before a request is ever sent.
class Validators {
  Validators._();

  static final _emailRegex = RegExp(r'^[\w.+-]+@[\w-]+\.[\w.-]+$');

  static String? required(String? value, {String field = 'This field'}) {
    if (value == null || value.trim().isEmpty) return '$field is required';
    return null;
  }

  static String? email(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'Email is required';
    if (!_emailRegex.hasMatch(v)) return 'Enter a valid email address';
    return null;
  }

  /// Backend requires MinLength(6) on password.
  static String? password(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    return null;
  }

  static String? confirmPassword(String? value, String original) {
    if (value == null || value.isEmpty) return 'Re-enter your password';
    if (value != original) return 'Passwords do not match';
    return null;
  }

  static final _matricRegex = RegExp(r'^[A-Z]{3}/\d{2}/\d{4}$');

  /// Matric number is the student's identity, masked to the FUTA `ABC/00/0000`
  /// pattern by [MatricInputFormatter]. The backend doesn't enforce it (the
  /// check is commented out in auth.service.ts), so we require the full pattern
  /// here — the student app should never create a matric-less student.
  static String? matricNo(String? value) {
    final v = value?.trim().toUpperCase() ?? '';
    if (v.isEmpty) return 'Matric number is required';
    if (!_matricRegex.hasMatch(v)) return 'Use the format ABC/00/0000';
    return null;
  }

  /// Nigerian mobile, optional. The +234 prefix lives outside the field; here we
  /// just check the local part is a full 10 digits once anything is entered.
  static String? nigerianPhone(String? value) {
    final digits = (value ?? '').replaceAll(RegExp('[^0-9]'), '');
    if (digits.isEmpty) return null; // optional
    final local = digits.startsWith('0') ? digits.substring(1) : digits;
    if (local.length != 10) return 'Enter a valid 10-digit number';
    return null;
  }
}
