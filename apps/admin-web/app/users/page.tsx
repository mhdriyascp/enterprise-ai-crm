'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useUsers, type User } from '@/lib/hooks';

const columns: Column<User>[] = [
  {
    header: 'Name',
    cell: (u) => (
      <span className="font-medium text-slate-900">
        {u.firstName} {u.lastName}
      </span>
    ),
  },
  { header: 'Email', cell: (u) => u.email },
  { header: 'Roles', cell: (u) => u.roles.join(', ') || '—' },
  {
    header: 'Status',
    cell: (u) => (
      <StatusBadge tone={u.status === 'active' ? 'green' : 'slate'}>{u.status}</StatusBadge>
    ),
  },
];

export default function UsersPage() {
  const { data, isLoading, isError } = useUsers();

  return (
    <div>
      <PageHeader title="Users" description="Members across all tenants." />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(u) => u.id}
        emptyMessage="No users yet."
      />
    </div>
  );
}
