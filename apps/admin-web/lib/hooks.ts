'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, type Paginated } from './api';
import { config, SERVICES, type ServiceDescriptor } from './config';

// =============================================================================
// Domain types (trimmed to the fields the admin views render).
// =============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  status: string;
  updatedAt: string;
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  status: string;
  lastSyncedAt: string | null;
}

export interface ServiceHealth {
  service: ServiceDescriptor;
  status: 'up' | 'down';
}

// =============================================================================
// Query hooks. Each targets the gateway route for the owning service.
// =============================================================================

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: ({ signal }) => apiFetch<Paginated<Tenant>>('/identity/tenants', { signal }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => apiFetch<Paginated<User>>('/identity/users', { signal }),
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: ({ signal }) => apiFetch<Paginated<Workflow>>('/workflow/workflows', { signal }),
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: ({ signal }) =>
      apiFetch<Paginated<Integration>>('/integration/integrations', { signal }),
  });
}

async function pingService(service: ServiceDescriptor, signal?: AbortSignal): Promise<ServiceHealth> {
  try {
    const response = await fetch(`${config.apiUrl}/${service.key}/health`, {
      signal,
      cache: 'no-store',
    });
    return { service, status: response.ok ? 'up' : 'down' };
  } catch {
    return { service, status: 'down' };
  }
}

export function useServiceHealth() {
  return useQuery({
    queryKey: ['service-health'],
    refetchInterval: 30_000,
    queryFn: ({ signal }) => Promise.all(SERVICES.map((service) => pingService(service, signal))),
  });
}
