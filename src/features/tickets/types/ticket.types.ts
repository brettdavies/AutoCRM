/**
 * Type Hierarchy for Ticket System
 * 
 * Base Types:
 * - Ticket: Core ticket properties
 * - Profile: User profile information
 * 
 * Database Response Types:
 * - SupabaseTicketResponse: Raw database response with relationships
 * 
 * Frontend Types:
 * - TicketWithRelations: Enriched ticket data for UI consumption
 * 
 * DTO Types:
 * - CreateTicketDTO: Data required to create a ticket
 * - UpdateTicketDTO: Partial data for ticket updates
 */

/** Status options for a ticket's lifecycle */
export type TicketStatus = 'unassigned' | 'in_progress' | 'under_review' | 
                          'escalated' | 'resolved' | 'closed';

/** Base ticket properties from the database */
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  assigned_agent_id?: string;
  assigned_team_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Category relationship for tickets */
export interface TicketCategory {
  ticket_id: string;
  category_id: string;
  added_at: string;
}

/** Watcher relationship for tickets */
export interface TicketWatcher {
  ticket_id: string;
  watcher_id: string;
  watcher_type: 'team' | 'agent';
  added_at: string;
}

/** History entry for ticket changes */
export interface TicketHistory {
  id: string;
  ticket_id: string;
  change_type: 'status' | 'assignment' | 'category' | 'description';
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: string;
}

/** User profile information */
export interface Profile {
  id: string;
  full_name: string;
  email: string;
}

/** Raw ticket response from Supabase including relationships */
export interface SupabaseTicketResponse extends Ticket {
  team: { id: string; name: string } | null;
  categories: TicketCategory[];
  watchers: TicketWatcher[];
  history: TicketHistory[];
}

/** Enriched ticket data with resolved relationships */
export interface TicketWithRelations extends Omit<Ticket, 'assigned_agent_id'> {
  categories: TicketCategory[];
  watchers: TicketWatcher[];
  history: TicketHistory[];
  team: {
    id: string;
    name: string;
  } | null;
  assigned_agent: Profile | null;
  creator: Profile;
}

/** Data required to create a new ticket */
export interface CreateTicketDTO {
  title: string;
  description: string;
  team_id?: string;
  category_ids: string[];
  attachments?: File[];
}

/** Data allowed to be updated on a ticket */
export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  status?: TicketStatus;
  assigned_agent_id?: string | null;
  assigned_team_id?: string | null;
}

/** Options for filtering tickets in useTickets hook */
export interface UseTicketsOptions {
  teamId?: string | undefined;
  agentId?: string | undefined;
  status?: TicketStatus | undefined;
  userId?: string | undefined;
  userTeamId?: string | undefined;
}

/** Type guard for Supabase ticket response */
export function isSupabaseTicketResponse(ticket: any): ticket is SupabaseTicketResponse {
  return (
    ticket &&
    typeof ticket.id === 'string' &&
    (ticket.team === null || (typeof ticket.team === 'object' && typeof ticket.team.id === 'string')) &&
    Array.isArray(ticket.categories) &&
    Array.isArray(ticket.watchers) &&
    Array.isArray(ticket.history)
  );
}

/** Type guard for profile data */
export function isProfile(profile: any): profile is Profile {
  return (
    profile &&
    typeof profile.id === 'string' &&
    typeof profile.full_name === 'string' &&
    typeof profile.email === 'string'
  );
}

/** Supabase real-time payload for ticket changes */
export interface TicketRealtimePayload {
  id: string;
  [key: string]: any;
} 