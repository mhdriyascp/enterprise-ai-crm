/// Runtime configuration for the CRM mobile app.
///
/// The base URL points at the Mobile API (BFF) which aggregates and slims down
/// responses from the upstream domain services. Override at build time with:
///
///   flutter run --dart-define=MOBILE_API_URL=https://api.example.com
class AppConfig {
  const AppConfig._();

  static const String mobileApiUrl = String.fromEnvironment(
    'MOBILE_API_URL',
    defaultValue: 'http://localhost:3300',
  );

  /// API version prefix exposed by the Mobile BFF.
  static const String apiPrefix = '/mobile/v1';
}
