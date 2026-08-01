import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'src/screens/dashboard_screen.dart';
import 'src/screens/login_screen.dart';
import 'src/state/auth_state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final AuthState auth = AuthState();
  await auth.load();
  runApp(CrmApp(auth: auth));
}

class CrmApp extends StatelessWidget {
  const CrmApp({super.key, required this.auth});

  final AuthState auth;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AuthState>.value(
      value: auth,
      child: MaterialApp(
        title: 'Enterprise AI CRM',
        theme: ThemeData(
          colorSchemeSeed: const Color(0xFF4F46E5),
          useMaterial3: true,
        ),
        home: Consumer<AuthState>(
          builder: (BuildContext context, AuthState state, _) {
            return state.isAuthenticated
                ? const DashboardScreen()
                : const LoginScreen();
          },
        ),
      ),
    );
  }
}
