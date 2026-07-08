import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/env.dart';
import 'api_exception.dart';

/// Thin wrapper over `package:http` that speaks the MovIO backend's response
/// envelope so feature code doesn't repeat JSON/error plumbing.
///
/// Every backend response is either
///   { success: true,  message, data }          (2xx)
/// or
///   { success: false, message, errors? }        (4xx/5xx)
/// This client returns `data` on success and throws a typed [ApiException]
/// otherwise — including a friendly message when the server can't be reached.
class ApiClient {
  ApiClient({http.Client? httpClient, this.baseUrl = Env.apiBaseUrl})
      : _http = httpClient ?? http.Client();

  final http.Client _http;
  final String baseUrl;

  static const Duration _timeout = Duration(seconds: 15);

  /// POST [path] with a JSON [body]. Returns the decoded `data` object.
  Future<Map<String, dynamic>> post(
    String path, {
    required Map<String, dynamic> body,
    String? token,
  }) async {
    return _send(() => _http.post(
          _uri(path),
          headers: _headers(token),
          body: jsonEncode(body),
        ));
  }

  /// GET [path]. Returns the decoded `data` object.
  Future<Map<String, dynamic>> get(String path, {String? token}) async {
    return _send(() => _http.get(_uri(path), headers: _headers(token)));
  }

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Map<String, String> _headers(String? token) => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  /// Runs [request], maps transport failures to [ApiException.network], and
  /// unwraps the success/error envelope.
  Future<Map<String, dynamic>> _send(
    Future<http.Response> Function() request,
  ) async {
    late http.Response res;
    try {
      res = await request().timeout(_timeout);
    } on SocketException {
      throw ApiException.network();
    } on TimeoutException {
      throw ApiException.network();
    } on http.ClientException {
      throw ApiException.network();
    }

    Map<String, dynamic> json;
    try {
      json = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException.unexpected();
    }

    final success = json['success'] == true;
    if (success && res.statusCode >= 200 && res.statusCode < 300) {
      return (json['data'] as Map<String, dynamic>?) ?? const {};
    }

    // Failure envelope: surface the backend's message + any per-field details.
    final message = (json['message'] as String?) ?? 'Request failed';
    throw ApiException(
      message,
      statusCode: res.statusCode,
      fieldErrors: _extractFieldErrors(json['errors']),
    );
  }

  /// Flattens the ValidationError shape ([{ field, constraints: [...] }]) into a
  /// flat list of readable messages. Tolerant of other/absent shapes.
  List<String>? _extractFieldErrors(dynamic errors) {
    if (errors is! List) return null;
    final messages = <String>[];
    for (final e in errors) {
      if (e is Map && e['constraints'] is List) {
        for (final c in (e['constraints'] as List)) {
          messages.add(c.toString());
        }
      }
    }
    return messages.isEmpty ? null : messages;
  }
}
