'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { useAuthStore, type Principal } from '@/store/auth';

// In production this screen redirects to Keycloak (OIDC Authorization Code +
// PKCE). For local development it accepts a pasted access token so the portal
// can be exercised against the gateway without a full IdP round-trip.
export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const principal: Principal = {
      userId: 'local',
      tenantId: 'local',
      email: email || 'admin@example.com',
      roles: ['platform-admin'],
      permissions: ['*'],
    };
    setSession(token, principal);
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Sign in" description="Authenticate to access the admin portal." />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-slate-700">
            Access token
          </label>
          <textarea
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none"
            placeholder="Paste a bearer token"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
