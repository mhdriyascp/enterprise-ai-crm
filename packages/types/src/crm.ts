// =============================================================================
// CRM Domain Types
// =============================================================================

import type { UUID, ISODateString, BaseEntity } from './common';

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------
export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  revenue?: number;
  currency?: string;
  status: CustomerStatus;
  ownerId?: UUID;
  tags: string[];
  customFields: Record<string, unknown>;
}

export type CustomerStatus = 'active' | 'inactive' | 'prospect' | 'churned';
export type CompanySize = 'solo' | 'small' | 'medium' | 'large' | 'enterprise';

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------
export interface Contact extends BaseEntity {
  customerId?: UUID;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  isPrimary: boolean;
  status: ContactStatus;
  tags: string[];
}

export type ContactStatus = 'active' | 'inactive';

// ---------------------------------------------------------------------------
// Lead
// ---------------------------------------------------------------------------
export interface Lead extends BaseEntity {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  source: LeadSource;
  status: LeadStatus;
  score?: number;
  ownerId?: UUID;
  tags: string[];
  notes?: string;
}

export type LeadSource =
  | 'website'
  | 'referral'
  | 'social'
  | 'email'
  | 'cold_call'
  | 'event'
  | 'partner'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted';

// ---------------------------------------------------------------------------
// Opportunity
// ---------------------------------------------------------------------------
export interface Opportunity extends BaseEntity {
  name: string;
  customerId: UUID;
  contactId?: UUID;
  stage: OpportunityStage;
  amount: number;
  currency: string;
  probability: number;
  expectedCloseDate: ISODateString;
  actualCloseDate?: ISODateString;
  ownerId?: UUID;
  tags: string[];
  notes?: string;
}

export type OpportunityStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: ISODateString;
  assigneeId?: UUID;
  relatedEntityType?: string;
  relatedEntityId?: UUID;
  tags: string[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// ---------------------------------------------------------------------------
// Activity / Interaction
// ---------------------------------------------------------------------------
export interface Activity extends BaseEntity {
  type: ActivityType;
  subject: string;
  description?: string;
  relatedEntityType: string;
  relatedEntityId: UUID;
  performedAt: ISODateString;
  performedById: UUID;
}

export type ActivityType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'note'
  | 'task'
  | 'demo'
  | 'proposal';
