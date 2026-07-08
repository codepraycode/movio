/// A single, typed failure surface for all API calls.
///
/// The UI never sees a raw `SocketException` or a JSON map — it catches one
/// [ApiException] and shows `.message`, which is always human-readable.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.fieldErrors});

  /// User-facing, already friendly (either the backend's `message` or a
  /// connectivity message we generate).
  final String message;

  /// HTTP status if the request reached the server; null for network failures.
  final int? statusCode;

  /// class-validator's per-field messages when the backend returns 400, so a
  /// screen *could* map them onto specific fields. Null otherwise.
  final List<String>? fieldErrors;

  /// The request never reached the server (wrong IP, backend down, no Wi-Fi).
  factory ApiException.network() => ApiException(
        "Can't reach the MovIO server. Check that you're on the same Wi-Fi as "
        'the backend and that it\'s running.',
      );

  /// Reached the server but the response wasn't valid JSON we understood.
  factory ApiException.unexpected() =>
      ApiException('Something went wrong. Please try again.');

  @override
  String toString() => 'ApiException($statusCode): $message';
}
