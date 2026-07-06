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

  /// Fired once when an *authenticated* request (one that carried a token) comes
  /// back 401 — i.e. the JWT expired or was revoked. The app registers this in
  /// startup to sign the user out and route them back to login, rather than
  /// letting every screen hit a wall of failing calls. Set to null by default so
  /// tests and the login/register flow (which send no token) are unaffected.
  static void Function()? onUnauthorized;

  /// POST [path] with a JSON [body]. Returns the decoded `data` object.
  Future<Map<String, dynamic>> post(
    String path, {
    required Map<String, dynamic> body,
    String? token,
  }) async {
    final data = await _send(
      () => _http.post(
        _uri(path),
        headers: _headers(token),
        body: jsonEncode(body),
      ),
      authed: token != null,
    );
    return (data as Map<String, dynamic>?) ?? const {};
  }

  /// GET [path]. Returns the decoded `data` object.
  Future<Map<String, dynamic>> get(String path, {String? token}) async {
    final data = await _send(
      () => _http.get(_uri(path), headers: _headers(token)),
      authed: token != null,
    );
    return (data as Map<String, dynamic>?) ?? const {};
  }

  /// GET [path] where the backend's `data` is a JSON array (e.g. list endpoints
  /// like `/tracking/active`). Returns the raw list of decoded elements.
  Future<List<dynamic>> getList(String path, {String? token}) async {
    final data = await _send(
      () => _http.get(_uri(path), headers: _headers(token)),
      authed: token != null,
    );
    return (data as List<dynamic>?) ?? const [];
  }

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Map<String, String> _headers(String? token) => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  /// Runs [request], maps transport failures to [ApiException.network], and
  /// unwraps the success/error envelope. Returns the raw `data` payload (an
  /// object or a list depending on the endpoint); callers cast as appropriate.
  Future<dynamic> _send(
    Future<http.Response> Function() request, {
    bool authed = false,
  }) async {
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
      return json['data'];
    }

    // A token-carrying request that comes back 401 means the session is no
    // longer valid — tell the app to sign out so the user re-authenticates
    // instead of bouncing off failing calls. (Login/register send no token, so
    // their "wrong credentials" 401 never trips this.)
    if (res.statusCode == 401 && authed) {
      onUnauthorized?.call();
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
