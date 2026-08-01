import Link from 'next/link';

export const metadata = { title: 'Pricing — Enterprise AI CRM' };

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    period: '/user/mo',
    features: ['Core CRM', 'Up to 5 users', 'Email support', 'AI assistant (basic)'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$79',
    period: '/user/mo',
    features: ['Everything in Starter', 'Workflow automation', 'Integrations', 'AI agents'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['SSO & SCIM', 'Dedicated tenant', 'SLA & priority support', 'On-prem option'],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pricing</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Simple, transparent plans that grow with you.</p>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              'rounded-lg border p-6 ' +
              (plan.highlighted ? 'border-brand-500 shadow-md' : 'border-slate-200')
            }
          >
            <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
            <p className="mt-4">
              <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
            <Link
              href="/contact"
              className={
                'mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ' +
                (plan.highlighted
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50')
              }
            >
              {plan.price === 'Custom' ? 'Contact sales' : 'Start free trial'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
