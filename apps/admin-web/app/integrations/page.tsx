'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useIntegrations, type Integration } from '@/lib/hooks';

function statusTone(status: string) {
  if (status === 'connected') return 'green' as const;
  if (status === 'error') return 'red' as const;
  if (status === 'pending') return 'amber' as const;
  return 'slate' as const;
}

const columns: Column<Integration>[] = [
  { header: 'Name', cell: (i) => <span className="font-medium text-slate-900">{i.name}</span> },
  { header: 'Provider', cell: (i) => i.provider },
  { header: 'Status', cell: (i) => <StatusBadge tone={statusTone(i.status)}>{i.status}</StatusBadge> },
  {
    header: 'Last Synced',
    cell: (i) => (i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleString() : '—'),
  },
];

export default function IntegrationsPage() {
  const { data, isLoading, isError } = useIntegrations();

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Third-party connectors managed by the integration service."
      />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(i) => i.id}
        emptyMessage="No integrations configured yet."
      />
    </div>
  );
}
