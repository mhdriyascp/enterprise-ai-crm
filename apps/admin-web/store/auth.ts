import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// Auth store. In production the token is obtained from Keycloak (OIDC); here we
// keep a light-weight store that holds the decoded principal + access token so
// the API client and RBAC-aware navigation can react to it.
// =============================================================================

export interface Principal {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  principal: Principal | null;
  setSession: (token: string, principal: Principal) => void;
  clearSession: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      principal: null,
      setSession: (token, principal) => set({ token, principal }),
      clearSession: () => set({ token: null, principal: null }),
      hasRole: (role) => get().principal?.roles.includes(role) ?? false,
    }),
    { name: 'crm-admin-auth' },
  ),
);
