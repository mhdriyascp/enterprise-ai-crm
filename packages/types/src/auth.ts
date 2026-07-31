// =============================================================================
// Auth & IAM Types
// =============================================================================

import type { UUID, ISODateString } from './common';

export interface JwtPayload {
  sub: UUID;
  tenantId: UUID;
  email: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iss: string;
  iat: number;
}

export interface User {
  id: UUID;
  tenantId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  roles: Role[];
  status: UserStatus;
  lastLoginAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface Role {
  id: UUID;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: UUID;
  resource: string;
  action: string;
  description?: string;
}

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  settings: TenantSettings;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'cancelled';

export interface TenantSettings {
  maxUsers: number;
  maxStorageGb: number;
  aiEnabled: boolean;
  customDomain?: string;
}

export interface ApiKey {
  id: UUID;
  tenantId: UUID;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt?: ISODateString;
  lastUsedAt?: ISODateString;
  createdAt: ISODateString;
}
