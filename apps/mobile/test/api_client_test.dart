import 'dart:convert';

import 'package:crm_mobile/src/api/api_client.dart';
import 'package:crm_mobile/src/models/bootstrap.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  group('ApiClient.bootstrap', () {
    test('parses the profile and counts from the data envelope', () async {
      final MockClient mock = MockClient((http.Request request) async {
        expect(request.headers['Authorization'], 'Bearer ' + 'test-token');
        return http.Response(
          jsonEncode(<String, dynamic>{
            'data': <String, dynamic>{
              'profile': <String, dynamic>{
                'userId': 'u1',
                'tenantId': 't1',
                'email': 'rep@example.com',
                'roles': <String>['sales-rep'],
              },
              'counts': <String, dynamic>{
                'customers': 5,
                'leads': 3,
                'openTasks': 2,
                'opportunities': 7,
              },
            },
          }),
          200,
          headers: <String, String>{'content-type': 'application/json'},
        );
      });

      final ApiClient client = ApiClient(client: mock);
      final Bootstrap result = await client.bootstrap('test-token');

      expect(result.profile.userId, 'u1');
      expect(result.counts.customers, 5);
      expect(result.counts.opportunities, 7);
    });

    test('throws ApiException on a non-2xx response', () async {
      final MockClient mock =
          MockClient((http.Request request) async => http.Response('nope', 401));
      final ApiClient client = ApiClient(client: mock);

      expect(
        () => client.bootstrap('bad-token'),
        throwsA(isA<ApiException>()),
      );
    });
  });
}
