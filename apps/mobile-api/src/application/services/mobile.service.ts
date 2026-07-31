import type { GatewayClient, GatewayEnvelope } from '../../infrastructure/gateway/client';
import type { RegisterDeviceInput, SyncQuery } from '../../interface/dtos';

// =============================================================================
// Mobile aggregation service.
//
// Fans out to the domain services (through the gateway) and composes compact,
// bandwidth-efficient payloads tailored for the mobile app. All upstream calls
// forward the caller's bearer token so tenant/RBAC scoping is preserved.
// =============================================================================

interface CountEnvelope {
  meta?: { pagination?: { total: number } };
  data?: unknown[];
}

export interface BootstrapPayload {
  profile: { userId: string; tenantId: string; email?: string; roles: string[] };
  counts: { customers: number; leads: number; openTasks: number; opportunities: number };
  serverTime: string;
}

export interface DeviceRecord {
  id: string;
  tenantId: string;
  userId: string;
  platform: string;
  token: string;
  appVersion?: string;
  registeredAt: string;
}

export interface MobilePrincipal {
  userId: string;
  tenantId: string;
  email?: string;
  roles: string[];
}

/** Minimal in-memory device registry. In production this delegates to the
 * Notification service, which owns push-token storage and delivery. */
export class DeviceRegistry {
  private readonly devices = new Map<string, DeviceRecord>();

  register(principal: MobilePrincipal, input: RegisterDeviceInput): DeviceRecord {
    const record: DeviceRecord = {
      id: `${principal.userId}:${input.token}`,
      tenantId: principal.tenantId,
      userId: principal.userId,
      platform: input.platform,
      token: input.token,
      appVersion: input.appVersion,
      registeredAt: new Date().toISOString(),
    };
    this.devices.set(record.id, record);
    return record;
  }

  unregister(principal: MobilePrincipal, token: string): boolean {
    return this.devices.delete(`${principal.userId}:${token}`);
  }

  listForUser(userId: string): DeviceRecord[] {
    return [...this.devices.values()].filter((d) => d.userId === userId);
  }
}

function countOf(envelope: CountEnvelope): number {
  return envelope.meta?.pagination?.total ?? envelope.data?.length ?? 0;
}

export class MobileService {
  constructor(
    private readonly gateway: GatewayClient,
    private readonly pageSize: number,
  ) {}

  async bootstrap(principal: MobilePrincipal, token: string): Promise<BootstrapPayload> {
    const empty: CountEnvelope = { data: [] };
    const [customers, leads, tasks, opportunities] = await Promise.all([
      this.gateway.getOr<CountEnvelope>('/customer/customers', token, empty, { limit: 1 }),
      this.gateway.getOr<CountEnvelope>('/lead/leads', token, empty, { limit: 1 }),
      this.gateway.getOr<CountEnvelope>('/task/tasks', token, empty, { limit: 1, status: 'open' }),
      this.gateway.getOr<CountEnvelope>('/opportunity/opportunities', token, empty, { limit: 1 }),
    ]);

    return {
      profile: {
        userId: principal.userId,
        tenantId: principal.tenantId,
        email: principal.email,
        roles: principal.roles,
      },
      counts: {
        customers: countOf(customers),
        leads: countOf(leads),
        openTasks: countOf(tasks),
        opportunities: countOf(opportunities),
      },
      serverTime: new Date().toISOString(),
    };
  }

  /** Delta sync: return records updated since the supplied timestamp across the
   * core entities the mobile app caches offline. */
  async sync(
    token: string,
    query: SyncQuery,
  ): Promise<{ since: string | null; customers: unknown[]; tasks: unknown[]; leads: unknown[] }> {
    const limit = Math.min(query.limit, this.pageSize);
    const params: Record<string, string | number> = { limit, order: 'desc', sort: 'updatedAt' };
    if (query.since) params.updatedSince = query.since;

    const empty: GatewayEnvelope<unknown[]> = { data: [] };
    const [customers, tasks, leads] = await Promise.all([
      this.gateway.getOr<GatewayEnvelope<unknown[]>>('/customer/customers', token, empty, params),
      this.gateway.getOr<GatewayEnvelope<unknown[]>>('/task/tasks', token, empty, params),
      this.gateway.getOr<GatewayEnvelope<unknown[]>>('/lead/leads', token, empty, params),
    ]);

    return {
      since: query.since ?? null,
      customers: customers.data,
      tasks: tasks.data,
      leads: leads.data,
    };
  }
}
