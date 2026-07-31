import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Holds the authenticated session (access token) and persists it across app
/// launches. In production the token is obtained from Keycloak (OIDC); the
/// login screen currently accepts a pasted token for local development.
class AuthState extends ChangeNotifier {
  AuthState({SharedPreferences? prefs}) : _prefs = prefs;

  static const String _tokenKey = 'crm_access_token';

  SharedPreferences? _prefs;
  String? _token;

  String? get token => _token;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<void> load() async {
    _prefs ??= await SharedPreferences.getInstance();
    _token = _prefs!.getString(_tokenKey);
    notifyListeners();
  }

  Future<void> signIn(String token) async {
    _prefs ??= await SharedPreferences.getInstance();
    _token = token;
    await _prefs!.setString(_tokenKey, token);
    notifyListeners();
  }

  Future<void> signOut() async {
    _prefs ??= await SharedPreferences.getInstance();
    _token = null;
    await _prefs!.remove(_tokenKey);
    notifyListeners();
  }
}
