'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, type Paginated } from './api';

// =============================================================================
// Domain types (trimmed to the fields the CRM views render).
// =============================================================================

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  title: string | null;
  customerId: string | null;
}

export interface Lead {
  id: string;
  name: string;
  source: string;
  status: string;
  score: number | null;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  probability: number | null;
  closeDate: string | null;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

// =============================================================================
// Query hooks. Each targets the gateway route for the owning service.
// =============================================================================

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: ({ signal }) => apiFetch<Paginated<Customer>>('/customer/customers', { signal }),
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: ({ signal }) => apiFetch<Paginated<Contact>>('/contact/contacts', { signal }),
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: ({ signal }) => apiFetch<Paginated<Lead>>('/lead/leads', { signal }),
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: ({ signal }) =>
      apiFetch<Paginated<Opportunity>>('/opportunity/opportunities', { signal }),
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: ({ signal }) => apiFetch<Paginated<Task>>('/task/tasks', { signal }),
  });
}

// =============================================================================
// Mutations
// =============================================================================

/** Move an opportunity to a new pipeline stage (optimistic-friendly). */
export function useMoveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiFetch<{ data: Opportunity }>(`/opportunity/opportunities/${id}`, {
        method: 'PATCH',
        body: { stage },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

// =============================================================================
// AI assistant
// =============================================================================

export interface AssistantReply {
  data: { answer: string; citations?: { source: string; snippet?: string }[] };
}

export function useAssistant() {
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<AssistantReply>('/ai/agents/assistant/chat', {
        method: 'POST',
        body: { message },
      }),
  });
}
