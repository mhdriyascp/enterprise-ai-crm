'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { useServiceHealth } from '@/lib/hooks';

export default function DashboardPage() {
  const { data, isLoading, isError } = useServiceHealth();

  return (
    <div>
      <PageHeader
        title="Service Health"
        description="Live status of the platform microservices via the API gateway."
      />

      {isLoading ? <p className="text-sm text-slate-500">Checking services…</p> : null}
      {isError ? <p className="text-sm text-red-600">Unable to reach the gateway.</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map(({ service, status }) => (
          <div
            key={service.key}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{service.name}</h2>
              <StatusBadge tone={status === 'up' ? 'green' : 'red'}>
                {status === 'up' ? 'Operational' : 'Down'}
              </StatusBadge>
            </div>
            <p className="mt-2 text-xs text-slate-500">{service.description}</p>
            <p className="mt-3 text-xs text-slate-400">Port {service.port}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
