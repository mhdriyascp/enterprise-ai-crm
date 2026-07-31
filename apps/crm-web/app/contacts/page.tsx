'use client';

import { PageHeader } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useContacts, type Contact } from '@/lib/hooks';

const columns: Column<Contact>[] = [
  {
    header: 'Name',
    cell: (c) => (
      <span className="font-medium text-slate-900">
        {c.firstName} {c.lastName}
      </span>
    ),
  },
  { header: 'Title', cell: (c) => c.title ?? '—' },
  { header: 'Email', cell: (c) => c.email ?? '—' },
];

export default function ContactsPage() {
  const { data, isLoading, isError } = useContacts();

  return (
    <div>
      <PageHeader title="Contacts" description="People associated with your accounts." />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(c) => c.id}
        emptyMessage="No contacts yet."
      />
    </div>
  );
}
