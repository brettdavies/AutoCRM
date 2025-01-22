import { supabase } from '@/core/supabase/client';
import type {
  Ticket,
  CreateTicketDTO,
  UpdateTicketDTO,
  TicketWithRelations,
  SupabaseTicketResponse,
  Profile,
  TicketWatcher,
  TicketRealtimePayload
} from '@/features/tickets/types/ticket.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export class TicketService {
  private static readonly TICKET_SELECT = `
    id,
    title,
    description,
    status,
    created_at,
    updated_at,
    created_by,
    assigned_team_id,
    assigned_agent_id,
    team:teams!assigned_team_id(*),
    categories:ticket_categories(*),
    watchers:ticket_watchers(*),
    history:ticket_history(*)
  `;

  private static async enrichTicketWithProfiles(
    rawTicket: any
  ): Promise<TicketWithRelations> {
    const ticket = rawTicket as SupabaseTicketResponse;
    
    // Fetch profiles for assigned agent and creator
    const userIds = new Set<string>();
    if (ticket.assigned_agent_id) userIds.add(ticket.assigned_agent_id);
    if (ticket.created_by) userIds.add(ticket.created_by);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));

    if (profilesError) throw profilesError;

    const profileMap = new Map(profilesData?.map(profile => [profile.id, profile]));

    const assignedAgent = ticket.assigned_agent_id 
      ? profileMap.get(ticket.assigned_agent_id) as Profile | undefined
      : null;

    const creator = profileMap.get(ticket.created_by) as Profile;
    if (!creator) throw new Error('Creator profile not found');

    // If we have an assigned_team_id but no team data, fetch it
    let team = ticket.team;
    if (ticket.assigned_team_id && !team) {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', ticket.assigned_team_id)
        .single();
      
      if (teamError) throw teamError;
      team = teamData;
    }

    return {
      ...ticket,
      team,
      assigned_agent: assignedAgent || null,
      creator
    };
  }

  static async getTickets(options: {
    teamId?: string | undefined;
    agentId?: string | undefined;
    status?: Ticket['status'] | undefined;
    userId: string;
    userRole?: string | undefined;
    userTeamId?: string | undefined;
  }): Promise<TicketWithRelations[]> {
    const { teamId, agentId, status, userId, userTeamId } = options;

    let query = supabase
      .from('tickets')
      .select(this.TICKET_SELECT);

    // Apply filters based on user's role and context
    const { data: { user } } = await supabase.auth.getUser();
    const userRole = user?.user_metadata?.role;

    if (userRole === 'admin') {
      // Admins can see all tickets, just apply optional filters
      if (teamId) {
        query = query.eq('assigned_team_id', teamId);
      }
      if (agentId) {
        query = query.eq('assigned_agent_id', agentId);
      }
    } else if (userRole === 'agent') {
      // Agents can see tickets they're assigned to or in their team
      query = query.or(
        `assigned_agent_id.eq.${userId},assigned_team_id.eq.${userTeamId}`
      );
    } else {
      // Regular users can only see tickets they created
      query = query.eq('created_by', userId)
                  .order('created_at', { ascending: false });
    }

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: ticketsData, error: ticketsError } = await query;
    if (ticketsError) throw ticketsError;

    if (!ticketsData) return [];
    
    // Enrich tickets with profile data
    return Promise.all(ticketsData.map(ticket => this.enrichTicketWithProfiles(ticket)));
  }

  static async getTicket(id: string): Promise<TicketWithRelations> {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(this.TICKET_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return this.enrichTicketWithProfiles(ticket);
  }

  static async createTicket(dto: CreateTicketDTO): Promise<TicketWithRelations> {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title: dto.title,
        description: dto.description,
        status: 'unassigned',
        assigned_team_id: dto.team_id,
      })
      .select(this.TICKET_SELECT)
      .single();

    if (error) throw error;

    if (dto.category_ids.length > 0) {
      const categories = dto.category_ids.map(category_id => ({
        ticket_id: ticket.id,
        category_id,
      }));

      const { error: categoryError } = await supabase
        .from('ticket_categories')
        .insert(categories);

      if (categoryError) throw categoryError;
    }

    return this.enrichTicketWithProfiles(ticket);
  }

  static async updateTicket(
    id: string, 
    dto: UpdateTicketDTO
  ): Promise<TicketWithRelations> {
    const { error } = await supabase
      .from('tickets')
      .update(dto)
      .eq('id', id);

    if (error) throw error;
    return this.getTicket(id);
  }

  static async assignTicket(
    ticketId: string,
    agentId: string,
    teamId: string
  ): Promise<TicketWithRelations> {
    const { error } = await supabase
      .from('tickets')
      .update({
        assigned_agent_id: agentId,
        assigned_team_id: teamId,
        status: 'in_progress'
      })
      .eq('id', ticketId);

    if (error) throw error;
    return this.getTicket(ticketId);
  }

  static async updateStatus(
    ticketId: string,
    status: Ticket['status']
  ): Promise<TicketWithRelations> {
    const { error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) throw error;
    return this.getTicket(ticketId);
  }

  static async addWatcher(
    ticketId: string,
    watcherId: string,
    watcherType: TicketWatcher['watcher_type']
  ): Promise<TicketWithRelations> {
    const { error: watcherError } = await supabase
      .from('ticket_watchers')
      .insert({
        ticket_id: ticketId,
        watcher_id: watcherId,
        watcher_type: watcherType
      });

    if (watcherError) throw watcherError;

    return this.getTicket(ticketId);
  }

  static async removeWatcher(
    ticketId: string,
    watcherId: string
  ): Promise<TicketWithRelations> {
    const { error: watcherError } = await supabase
      .from('ticket_watchers')
      .delete()
      .match({ ticket_id: ticketId, watcher_id: watcherId });

    if (watcherError) throw watcherError;

    return this.getTicket(ticketId);
  }

  static async getWatchers(ticketId: string): Promise<TicketWatcher[]> {
    const { data: watchers, error } = await supabase
      .from('ticket_watchers')
      .select('*')
      .eq('ticket_id', ticketId);

    if (error) throw error;
    return watchers;
  }

  static subscribeToWatchers(
    ticketId: string,
    callback: (watchers: TicketWatcher[]) => void
  ) {
    return supabase
      .channel(`watchers-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_watchers',
          filter: `ticket_id=eq.${ticketId}`
        },
        async () => {
          const watchers = await this.getWatchers(ticketId);
          callback(watchers);
        }
      )
      .subscribe();
  }

  static subscribeToTicket(ticketId: string | undefined, callback: (ticket: TicketWithRelations) => void) {
    const channel = supabase
      .channel(`ticket-${ticketId || 'all'}`)
      .on('postgres_changes' as never, {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: ticketId ? `id=eq.${ticketId}` : undefined
        },
        async (payload: RealtimePostgresChangesPayload<TicketRealtimePayload>) => {
          const newData = payload.new as TicketRealtimePayload;
          if (!newData?.id) {
            console.error('Invalid payload received:', payload);
            return;
          }
          const ticket = await this.getTicket(newData.id);
          callback(ticket);
        }
      )
      .subscribe();

    return channel;
  }
} 