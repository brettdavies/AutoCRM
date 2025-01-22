export type UserRole = 'customer' | 'agent' | 'admin';

export type TicketStatus = 'unassigned' | 'in_progress' | 'under_review' | 'escalated' | 'resolved' | 'closed';

export interface Tables {
  profiles: {
    Row: {
      id: string;
      email: string;
      full_name: string | null;
      role: UserRole;
      created_at: string;
      updated_at: string;
      last_login_at: string | null;
      is_active: boolean;
      preferences: Record<string, any>;
    };
    Insert: Omit<Tables['profiles']['Row'], 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Tables['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>;
  };
  teams: {
    Row: Team;
    Insert: Omit<Team, 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>;
  };
  tickets: {
    Row: Ticket;
    Insert: Omit<Ticket, 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Ticket, 'id' | 'created_at' | 'updated_at'>>;
  };
  ticket_categories: {
    Row: TicketCategory;
    Insert: Omit<TicketCategory, 'added_at'>;
    Update: Partial<Omit<TicketCategory, 'ticket_id' | 'category_id' | 'added_at'>>;
  };
  ticket_watchers: {
    Row: TicketWatcher;
    Insert: Omit<TicketWatcher, 'added_at'>;
    Update: Partial<Omit<TicketWatcher, 'ticket_id' | 'watcher_id' | 'watcher_type' | 'added_at'>>;
  };
  ticket_history: {
    Row: TicketHistory;
    Insert: Omit<TicketHistory, 'id' | 'changed_at'>;
    Update: Partial<Omit<TicketHistory, 'id' | 'ticket_id' | 'changed_at'>>;
  };
}

export interface Database {
  public: {
    Tables: Tables;
  };
}

// Export specific table types for convenience
export type ProfileRow = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

export interface Team {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  created_by: string;
  assigned_agent_id?: string;
  assigned_team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketCategory {
  ticket_id: string;
  category_id: string;
  added_at: string;
  added_by: string;
}

export interface TicketWatcher {
  ticket_id: string;
  watcher_id: string;
  watcher_type: 'team' | 'agent';
  added_at: string;
  added_by: string;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
  };
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  change_type: 'status' | 'assignment' | 'category' | 'watcher' | 'comment';
  old_value?: string;
  new_value: string;
  changed_at: string;
  changed_by: string;
}

