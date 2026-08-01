import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../models/bootstrap.dart';
import '../state/auth_state.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.apiClient});

  final ApiClient? apiClient;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final ApiClient _api = widget.apiClient ?? ApiClient();
  Future<Bootstrap>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final String? token = context.read<AuthState>().token;
    if (token != null) {
      setState(() => _future = _api.bootstrap(token));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthState>().signOut(),
          ),
        ],
      ),
      body: FutureBuilder<Bootstrap>(
        future: _future,
        builder: (BuildContext context, AsyncSnapshot<Bootstrap> snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Failed to load: ${snapshot.error}'));
          }
          final Bootstrap? data = snapshot.data;
          if (data == null) {
            return const Center(child: Text('No data'));
          }
          return GridView.count(
            crossAxisCount: 2,
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              _StatCard(label: 'Customers', value: data.counts.customers),
              _StatCard(label: 'Leads', value: data.counts.leads),
              _StatCard(label: 'Open Tasks', value: data.counts.openTasks),
              _StatCard(label: 'Opportunities', value: data.counts.opportunities),
            ],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text('$value', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(label),
          ],
        ),
      ),
    );
  }
}
