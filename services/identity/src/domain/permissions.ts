// =============================================================================
// Permission Catalog — the canonical set of platform permissions.
//
// A permission is expressed as `resource:action`. These are seeded into the
// `permissions` table and referenced by roles. Keep this list in sync with the
// capabilities exposed by the CRM services.
// =============================================================================

export interface PermissionDefinition {
  resource: string;
  action: string;
  description: string;
}

/** Build the `resource:action` string for a permission. */
export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

const CRUD_RESOURCES: Array<{ resource: string; label: string }> = [
  { resource: 'tenant', label: 'Tenants' },
  { resource: 'organization', label: 'Organizations' },
  { resource: 'user', label: 'Users' },
  { resource: 'role', label: 'Roles' },
  { resource: 'permission', label: 'Permissions' },
  { resource: 'apikey', label: 'API keys' },
  { resource: 'audit', label: 'Audit logs' },
  { resource: 'customer', label: 'Customers' },
  { resource: 'contact', label: 'Contacts' },
  { resource: 'lead', label: 'Leads' },
  { resource: 'opportunity', label: 'Opportunities' },
];

const ACTIONS = ['create', 'read', 'update', 'delete'] as const;

/** Full catalog of permission definitions. */
export const PERMISSIONS: PermissionDefinition[] = CRUD_RESOURCES.flatMap(
  ({ resource, label }) =>
    ACTIONS.map((action) => ({
      resource,
      action,
      description: `${action[0].toUpperCase()}${action.slice(1)} ${label.toLowerCase()}`,
    })),
);

/** Wildcard permission that grants access to everything (super admin). */
export const WILDCARD_PERMISSION = '*:*';

/** All permission keys as `resource:action` strings. */
export const ALL_PERMISSION_KEYS: string[] = PERMISSIONS.map((p) =>
  permissionKey(p.resource, p.action),
);

// -----------------------------------------------------------------------------
// System roles seeded for every new tenant.
// -----------------------------------------------------------------------------
export interface SystemRoleDefinition {
  name: string;
  description: string;
  /** Permission keys, or `['*:*']` for full access. */
  permissions: string[];
}

export const SYSTEM_ROLES: SystemRoleDefinition[] = [
  {
    name: 'admin',
    description: 'Full administrative access to the tenant.',
    permissions: [WILDCARD_PERMISSION],
  },
  {
    name: 'manager',
    description: 'Manage CRM data and view users.',
    permissions: [
      'user:read',
      'organization:read',
      ...['customer', 'contact', 'lead', 'opportunity'].flatMap((r) =>
        ACTIONS.map((a) => permissionKey(r, a)),
      ),
    ],
  },
  {
    name: 'member',
    description: 'Standard read/write access to CRM data.',
    permissions: ['customer', 'contact', 'lead', 'opportunity'].flatMap((r) => [
      permissionKey(r, 'create'),
      permissionKey(r, 'read'),
      permissionKey(r, 'update'),
    ]),
  },
  {
    name: 'viewer',
    description: 'Read-only access to CRM data.',
    permissions: ['customer', 'contact', 'lead', 'opportunity'].map((r) =>
      permissionKey(r, 'read'),
    ),
  },
];

/** The role assigned to the first user that registers a new tenant. */
export const DEFAULT_OWNER_ROLE = 'admin';
