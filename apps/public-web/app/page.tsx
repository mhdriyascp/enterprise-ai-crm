import Link from 'next/link';

const HIGHLIGHTS = [
  {
    title: 'AI agents built in',
    body: 'Nine specialised agents with supervisor routing assist every stage of the sales cycle.',
  },
  {
    title: 'RAG-powered search',
    body: 'Answers grounded in your own data with citations, powered by a vector search pipeline.',
  },
  {
    title: 'Event-driven core',
    body: 'A Kafka backbone keeps every microservice in sync and every action auditable.',
  },
];

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          AI-first CRM
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Close more deals with a CRM that thinks alongside your team
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Enterprise AI CRM combines multi-tenant customer management with embedded AI agents,
          retrieval-augmented answers, and workflow automation.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href={`${appUrl}/login`}
            className="rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Get started
          </a>
          <Link
            href="/features"
            className="rounded-md border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore features
          </Link>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
