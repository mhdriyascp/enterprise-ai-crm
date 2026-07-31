import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/bootstrap.dart';

/// Thrown when the Mobile API returns a non-2xx response.
class ApiException implements Exception {
  ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Thin client for the Mobile API (BFF). Attaches the bearer token to every
/// request and unwraps the standard `{ data }` envelope used by the backend.
class ApiClient {
  ApiClient({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.mobileApiUrl;

  final http.Client _client;
  final String _baseUrl;

  Uri _uri(String path, [Map<String, String>? query]) {
    return Uri.parse('$_baseUrl${AppConfig.apiPrefix}$path')
        .replace(queryParameters: query);
  }

  Map<String, String> _headers(String token) => <String, String>{
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

  Future<Map<String, dynamic>> _getData(
    String path,
    String token, [
    Map<String, String>? query,
  ]) async {
    final http.Response response =
        await _client.get(_uri(path, query), headers: _headers(token));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, response.body);
    }

    final Map<String, dynamic> body =
        jsonDecode(response.body) as Map<String, dynamic>;
    return body['data'] as Map<String, dynamic>;
  }

  /// Fetch the app-startup payload (profile + dashboard counts).
  Future<Bootstrap> bootstrap(String token) async {
    final Map<String, dynamic> data = await _getData('/bootstrap', token);
    return Bootstrap.fromJson(data);
  }

  /// Register a push notification device token.
  Future<void> registerDevice(
    String token, {
    required String pushToken,
    required String platform,
  }) async {
    final http.Response response = await _client.post(
      _uri('/devices'),
      headers: _headers(token),
      body: jsonEncode(<String, String>{
        'token': pushToken,
        'platform': platform,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, response.body);
    }
  }

  void close() => _client.close();
}
