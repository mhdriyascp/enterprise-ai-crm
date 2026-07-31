'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useWorkflows, type Workflow } from '@/lib/hooks';

function statusTone(status: string) {
  if (status === 'active' || status === 'published') return 'green' as const;
  if (status === 'draft') return 'amber' as const;
  return 'slate' as const;
}

const columns: Column<Workflow>[] = [
  { header: 'Name', cell: (w) => <span className="font-medium text-slate-900">{w.name}</span> },
  { header: 'Trigger', cell: (w) => w.trigger },
  { header: 'Status', cell: (w) => <StatusBadge tone={statusTone(w.status)}>{w.status}</StatusBadge> },
  { header: 'Updated', cell: (w) => new Date(w.updatedAt).toLocaleDateString() },
];

export default function WorkflowsPage() {
  const { data, isLoading, isError } = useWorkflows();

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Automation definitions handled by the workflow service."
      />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(w) => w.id}
        emptyMessage="No workflows defined yet."
      />
    </div>
  );
}
