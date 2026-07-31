'use client';

import { PageHeader } from '@/components/ui';
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineStage } from '@/lib/config';
import { useMoveOpportunity, useOpportunities, type Opportunity } from '@/lib/hooks';

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const move = useMoveOpportunity();
  const currentIndex = PIPELINE_STAGES.indexOf(opp.stage as PipelineStage);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-slate-900">{opp.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        {opp.amount != null ? `$${opp.amount.toLocaleString()}` : 'No amount'}
        {opp.probability != null ? ` · ${opp.probability}%` : ''}
      </p>
      <div className="mt-2 flex gap-2">
        {currentIndex > 0 ? (
          <button
            type="button"
            onClick={() => move.mutate({ id: opp.id, stage: PIPELINE_STAGES[currentIndex - 1] })}
            className="text-xs text-slate-400 hover:text-brand-600"
          >
            ← Back
          </button>
        ) : null}
        {currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1 ? (
          <button
            type="button"
            onClick={() => move.mutate({ id: opp.id, stage: PIPELINE_STAGES[currentIndex + 1] })}
            className="ml-auto text-xs text-brand-600 hover:text-brand-700"
          >
            Advance →
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const { data, isLoading, isError } = useOpportunities();
  const opportunities = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag opportunities through the sales stages."
      />

      {isLoading ? <p className="text-sm text-slate-500">Loading pipeline…</p> : null}
      {isError ? <p className="text-sm text-red-600">Failed to load opportunities.</p> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PIPELINE_STAGES.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage);
          return (
            <div key={stage} className="flex flex-col rounded-lg bg-slate-100 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {STAGE_LABELS[stage]}
                </h2>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((opp) => (
                  <OpportunityCard key={opp.id} opp={opp} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
