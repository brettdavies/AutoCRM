import type { BaseAuthError } from '@/features/error-handling/types/error.types';
import type { Conversation, CreateConversationDTO, UpdateConversationDTO } from './conversation.types';
import type { Ticket, CreateTicketDTO, UpdateTicketDTO, TicketStatus } from './ticket.types';
import type { Team } from '@/features/teams/types/team.types';

export interface HookError extends BaseAuthError {
  component?: string;
  operation?: string;
}

export interface MutationState {
  isLoading: boolean;
  error: HookError | null;
}

export interface UseConversationsReturn {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  error: HookError | null;
  createConversation: {
    mutateAsync: (dto: CreateConversationDTO) => Promise<Conversation>;
    isLoading: boolean;
    error: HookError | null;
  };
  updateConversation: {
    mutateAsync: (params: { id: string; dto: UpdateConversationDTO }) => Promise<Conversation>;
    isLoading: boolean;
    error: HookError | null;
  };
  deleteConversation: {
    mutateAsync: (id: string) => Promise<void>;
    isLoading: boolean;
    error: HookError | null;
  };
}

export interface UseTicketReturn {
  ticket: Ticket | undefined;
  isLoading: boolean;
  error: HookError | null;
  createTicket: {
    mutateAsync: (dto: CreateTicketDTO) => Promise<Ticket>;
    isLoading: boolean;
    error: HookError | null;
  };
  updateTicket: {
    mutateAsync: (params: { id: string; dto: UpdateTicketDTO }) => Promise<Ticket>;
    isLoading: boolean;
    error: HookError | null;
  };
  assignTicket: {
    mutateAsync: (params: { ticketId: string; agentId: string; teamId: string }) => Promise<Ticket>;
    isLoading: boolean;
    error: HookError | null;
  };
  updateStatus: {
    mutateAsync: (params: { ticketId: string; status: Ticket['status'] }) => Promise<Ticket>;
    isLoading: boolean;
    error: HookError | null;
  };
}

export interface UseTeamsReturn {
  teams: Team[] | undefined;
  isLoading: boolean;
  error: HookError | null;
}

export interface TicketFormData {
  title: string;
  description: string;
  team_id: string;
  priority: 'low' | 'medium' | 'high';
  category_ids: string[];
  attachments: File[];
}

export interface UseTicketFormReturn {
  formData: TicketFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  updateField: <K extends keyof TicketFormData>(field: K, value: TicketFormData[K]) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseTicketsReturn {
  tickets: Ticket[] | undefined;
  isLoading: boolean;
  error: HookError | null;
}

/** Options for filtering tickets in useTickets hook */
export interface UseTicketsOptions {
  teamId?: string | undefined;
  agentId?: string | undefined;
  status?: TicketStatus | undefined;
  userRole?: string | undefined;
} 