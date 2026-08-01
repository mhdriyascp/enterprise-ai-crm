'use client';

import { PageHeader } from '@/components/ui';
import { useCustomers, useLeads, useOpportunities, useTasks } from '@/lib/hooks';

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string | number;
  hint?: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? '—' : value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const customers = useCustomers();
  const leads = useLeads();
  const opportunities = useOpportunities();
  const tasks = useTasks();

  const openTasks = (tasks.data?.data ?? []).filter((t) => t.status !== 'done').length;
  const pipelineValue = (opportunities.data?.data ?? [])
    .filter((o) => o.stage !== 'closed_lost')
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Your sales overview at a glance." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Customers"
          value={customers.data?.meta.pagination.total ?? customers.data?.data.length ?? 0}
          loading={customers.isLoading}
        />
        <StatCard
          label="Open Leads"
          value={leads.data?.meta.pagination.total ?? leads.data?.data.length ?? 0}
          loading={leads.isLoading}
        />
        <StatCard
          label="Open Tasks"
          value={openTasks}
          loading={tasks.isLoading}
        />
        <StatCard
          label="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          hint="Excludes closed-lost"
          loading={opportunities.isLoading}
        />
      </div>
    </div>
  );
}
