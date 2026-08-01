'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useTenants, type Tenant } from '@/lib/hooks';

const columns: Column<Tenant>[] = [
  { header: 'Name', cell: (t) => <span className="font-medium text-slate-900">{t.name}</span> },
  { header: 'Slug', cell: (t) => t.slug },
  {
    header: 'Status',
    cell: (t) => (
      <StatusBadge tone={t.status === 'active' ? 'green' : 'slate'}>{t.status}</StatusBadge>
    ),
  },
  { header: 'Created', cell: (t) => new Date(t.createdAt).toLocaleDateString() },
];

export default function TenantsPage() {
  const { data, isLoading, isError } = useTenants();

  return (
    <div>
      <PageHeader title="Tenants" description="Organisations onboarded to the platform." />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(t) => t.id}
        emptyMessage="No tenants yet."
      />
    </div>
  );
}
