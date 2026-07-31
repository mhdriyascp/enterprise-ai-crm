/// Typed models for the Mobile API bootstrap payload.
class DashboardCounts {
  const DashboardCounts({
    required this.customers,
    required this.leads,
    required this.openTasks,
    required this.opportunities,
  });

  final int customers;
  final int leads;
  final int openTasks;
  final int opportunities;

  factory DashboardCounts.fromJson(Map<String, dynamic> json) {
    return DashboardCounts(
      customers: (json['customers'] as num?)?.toInt() ?? 0,
      leads: (json['leads'] as num?)?.toInt() ?? 0,
      openTasks: (json['openTasks'] as num?)?.toInt() ?? 0,
      opportunities: (json['opportunities'] as num?)?.toInt() ?? 0,
    );
  }
}

class UserProfile {
  const UserProfile({
    required this.userId,
    required this.tenantId,
    required this.email,
    required this.roles,
  });

  final String userId;
  final String tenantId;
  final String? email;
  final List<String> roles;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      userId: json['userId'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
      email: json['email'] as String?,
      roles: (json['roles'] as List<dynamic>? ?? const [])
          .map((dynamic r) => r.toString())
          .toList(),
    );
  }
}

class Bootstrap {
  const Bootstrap({required this.profile, required this.counts});

  final UserProfile profile;
  final DashboardCounts counts;

  factory Bootstrap.fromJson(Map<String, dynamic> json) {
    return Bootstrap(
      profile: UserProfile.fromJson(json['profile'] as Map<String, dynamic>),
      counts: DashboardCounts.fromJson(json['counts'] as Map<String, dynamic>),
    );
  }
}
