'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useLeads, type Lead } from '@/lib/hooks';

function statusTone(status: string) {
  if (status === 'qualified' || status === 'converted') return 'green' as const;
  if (status === 'new' || status === 'contacted') return 'amber' as const;
  if (status === 'disqualified') return 'red' as const;
  return 'slate' as const;
}

const columns: Column<Lead>[] = [
  { header: 'Name', cell: (l) => <span className="font-medium text-slate-900">{l.name}</span> },
  { header: 'Source', cell: (l) => l.source },
  { header: 'Score', cell: (l) => (l.score == null ? '—' : l.score) },
  {
    header: 'Status',
    cell: (l) => <StatusBadge tone={statusTone(l.status)}>{l.status}</StatusBadge>,
  },
  { header: 'Created', cell: (l) => new Date(l.createdAt).toLocaleDateString() },
];

export default function LeadsPage() {
  const { data, isLoading, isError } = useLeads();

  return (
    <div>
      <PageHeader title="Leads" description="Inbound and outbound leads to qualify." />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(l) => l.id}
        emptyMessage="No leads yet."
      />
    </div>
  );
}
