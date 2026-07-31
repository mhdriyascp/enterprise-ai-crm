export const metadata = { title: 'Features — Enterprise AI CRM' };

const FEATURES = [
  {
    title: 'Customer 360',
    body: 'Unified customer, contact, and organization records across every touchpoint.',
  },
  {
    title: 'Lead & pipeline management',
    body: 'Score leads automatically and manage opportunities on a visual Kanban board.',
  },
  {
    title: 'AI assistant',
    body: 'Ask natural-language questions and get grounded answers with source citations.',
  },
  {
    title: 'Workflow automation',
    body: 'Model approvals and multi-step processes with a durable workflow engine.',
  },
  {
    title: 'Integrations',
    body: 'Connect Slack, Google Workspace, Microsoft 365, Stripe, HubSpot, and more.',
  },
  {
    title: 'Enterprise security',
    body: 'Multi-tenant isolation, RBAC, OIDC/Keycloak SSO, and full audit logging.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Features</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Everything your revenue team needs, with AI woven through the entire platform.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
