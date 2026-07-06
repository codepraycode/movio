import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;

import 'package:movio_mobile/core/network/api_client.dart';
import 'package:movio_mobile/core/network/api_exception.dart';

/// MOB-9 / session handling: the network layer must fail cleanly (never hang or
/// crash) and only trigger a forced sign-out when a *token-carrying* request is
/// rejected as 401.
void main() {
  tearDown(() => ApiClient.onUnauthorized = null);

  http.Client jsonClient(int status, String body) =>
      MockClient((_) async => http.Response(body, status));

  test('a network failure surfaces a friendly ApiException, not a raw error',
      () async {
    final api = ApiClient(
      httpClient: MockClient((_) async => throw http.ClientException('boom')),
    );
    expect(
      () => api.get('/wallet', token: 'abc'),
      throwsA(isA<ApiException>()),
    );
  });

  test('401 on an authenticated request fires onUnauthorized', () async {
    var fired = false;
    ApiClient.onUnauthorized = () => fired = true;
    final api = ApiClient(
      httpClient: jsonClient(401, '{"success":false,"message":"expired"}'),
    );

    await expectLater(
      () => api.get('/wallet', token: 'expired-token'),
      throwsA(isA<ApiException>()),
    );
    expect(fired, isTrue, reason: 'expired session should force a sign-out');
  });

  test('401 WITHOUT a token (e.g. wrong login) does NOT force sign-out',
      () async {
    var fired = false;
    ApiClient.onUnauthorized = () => fired = true;
    final api = ApiClient(
      httpClient:
          jsonClient(401, '{"success":false,"message":"bad credentials"}'),
    );

    await expectLater(
      () => api.post('/auth/login', body: const {}),
      throwsA(isA<ApiException>()),
    );
    expect(fired, isFalse,
        reason: 'wrong-password 401 must not log anyone out');
  });
}
