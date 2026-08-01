'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useCustomers, type Customer } from '@/lib/hooks';

const columns: Column<Customer>[] = [
  { header: 'Name', cell: (c) => <span className="font-medium text-slate-900">{c.name}</span> },
  { header: 'Email', cell: (c) => c.email ?? '—' },
  { header: 'Phone', cell: (c) => c.phone ?? '—' },
  {
    header: 'Status',
    cell: (c) => (
      <StatusBadge tone={c.status === 'active' ? 'green' : 'slate'}>{c.status}</StatusBadge>
    ),
  },
  { header: 'Created', cell: (c) => new Date(c.createdAt).toLocaleDateString() },
];

export default function CustomersPage() {
  const { data, isLoading, isError } = useCustomers();

  return (
    <div>
      <PageHeader title="Customers" description="Accounts owned by your team." />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(c) => c.id}
        emptyMessage="No customers yet."
      />
    </div>
  );
}
