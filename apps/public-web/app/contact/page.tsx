'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // The public site has no backend of its own; in production this posts to a
    // marketing/CRM lead-capture endpoint. Here we simply acknowledge locally.
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact sales</h1>
      <p className="mt-3 text-slate-600">
        Tell us about your team and we&apos;ll be in touch.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-md border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
          Thanks! We&apos;ve received your message and will reach out shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Send message
          </button>
        </form>
      )}
    </div>
  );
}
