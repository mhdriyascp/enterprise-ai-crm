# CRM Mobile (Flutter)

Cross-platform (iOS + Android) mobile client for the Enterprise AI CRM. It talks
to the **Mobile API (BFF)** (`apps/mobile-api`) rather than the domain services
directly, so responses are pre-aggregated and bandwidth-efficient.

## Tech Stack

- Flutter 3.22+ / Dart 3.4+
- `provider` for state management
- `http` for networking
- `shared_preferences` for token persistence

## Project Structure

```
lib/
├── main.dart                 # App entry point & routing (auth-gated)
└── src/
    ├── config.dart           # Base URL / API prefix (dart-define overridable)
    ├── api/api_client.dart   # Mobile BFF client (bearer auth, envelope unwrap)
    ├── models/bootstrap.dart # Typed models for the bootstrap payload
    ├── state/auth_state.dart # Session token persistence
    └── screens/              # Login & dashboard screens
```

Platform folders (`android/`, `ios/`, …) are generated on first run and are
git-ignored; run `flutter create .` in this directory to materialise them.

## Getting Started

```bash
flutter pub get
flutter run --dart-define=MOBILE_API_URL=http://localhost:3300
```

## Testing

```bash
flutter test
```

## Phase

This application was implemented in **Phase 19** of the development roadmap.
See [15-roadmap.md](../../docs/15-roadmap.md) for timeline.
