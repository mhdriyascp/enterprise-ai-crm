'use client';

import { PageHeader, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/table';
import { useTasks, type Task } from '@/lib/hooks';

function priorityTone(priority: string) {
  if (priority === 'high' || priority === 'urgent') return 'red' as const;
  if (priority === 'medium') return 'amber' as const;
  return 'slate' as const;
}

const columns: Column<Task>[] = [
  { header: 'Title', cell: (t) => <span className="font-medium text-slate-900">{t.title}</span> },
  {
    header: 'Priority',
    cell: (t) => <StatusBadge tone={priorityTone(t.priority)}>{t.priority}</StatusBadge>,
  },
  {
    header: 'Status',
    cell: (t) => (
      <StatusBadge tone={t.status === 'done' ? 'green' : 'slate'}>{t.status}</StatusBadge>
    ),
  },
  { header: 'Due', cell: (t) => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—') },
];

export default function TasksPage() {
  const { data, isLoading, isError } = useTasks();

  return (
    <div>
      <PageHeader title="Tasks" description="Your to-dos and reminders." />
      <DataTable
        columns={columns}
        rows={data?.data}
        isLoading={isLoading}
        isError={isError}
        rowKey={(t) => t.id}
        emptyMessage="No tasks yet."
      />
    </div>
  );
}
