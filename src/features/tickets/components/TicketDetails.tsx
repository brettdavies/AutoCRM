import { memo } from 'react';
import { useTicket } from '../hooks/useTicket';
import { useAuth } from '@/features/auth';
import { useTeamMembers } from '@/features/teams/hooks/useTeams';
import { useTeamList } from '@/features/teams/hooks/useTeams';
import { useQueryClient } from '@tanstack/react-query';
import logger from '@/shared/utils/logger.utils';
import type { TicketWithRelations } from '../types/ticket.types';
import type { Team } from '@/features/teams/types/team.types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Separator,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components';
import { useToast } from '@/components/ui/use-toast';

interface TicketDetailsProps {
  ticketId: string;
}

export const TicketDetails = memo(function TicketDetails({ ticketId }: TicketDetailsProps) {
  const { ticket, isLoading, error, updateTicket } = useTicket(ticketId);
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isTeamLead = profile?.user_role === 'agent' && session?.user?.user_metadata?.is_team_lead === 'true';
  const canReassign = profile?.user_role === 'admin' || isTeamLead;
  const isResolved = ticket?.status === 'resolved' || ticket?.status === 'closed';
  
  // Get team members if user can reassign
  const { members = [] } = useTeamMembers((ticket as TicketWithRelations)?.team?.id ?? '');
  const { data: teams = [] } = useTeamList();

  const handleAgentChange = async (agentId: string) => {
    if (!ticket) return;
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        dto: {
          assigned_agent_id: agentId === 'unassigned' ? null : agentId
        }
      });

      // Get agent name for the toast message
      const agentName = agentId === 'unassigned' 
        ? 'unassigned' 
        : members.find(m => m.id === agentId)?.full_name || 'unknown agent';

      // Show success toast
      toast({
        title: "Agent Updated",
        description: `Ticket #${ticket.id} has been reassigned to ${agentName}.`,
        variant: "success",
      });

      // Invalidate queries to trigger updates
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
    } catch (error) {
      console.error('Failed to reassign ticket:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update agent assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTeamChange = async (teamId: string) => {
    if (!ticket) return;
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        dto: {
          assigned_team_id: teamId === 'unassigned' ? null : teamId,
          assigned_agent_id: null // Clear agent when team changes
        }
      });

      // Get team name for the toast message
      const teamName = teamId === 'unassigned'
        ? 'unassigned'
        : teams.find(t => t.id === teamId)?.name || 'unknown team';

      // Show success toast
      toast({
        title: "Team Updated",
        description: `Ticket #${ticket.id} has been reassigned to ${teamName}. Previous agent assignment has been cleared.`,
        variant: "success",
      });

      // Invalidate queries to trigger updates
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });
    } catch (error) {
      console.error('Failed to reassign team:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update team assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  logger.debug('TicketDetails: Rendering with data:', {
    ticketId,
    ticket,
    isLoading,
    error,
    teamName: (ticket as TicketWithRelations)?.team?.name
  });

  if (isLoading) {
    return <div className="p-4">Loading ticket details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading ticket: {error.message}</div>;
  }

  if (!ticket) {
    return <div className="p-4">Ticket not found</div>;
  }

  const ticketWithRelations = ticket as TicketWithRelations;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{ticket.title}</CardTitle>
            <CardDescription>Created {new Date(ticket.created_at).toLocaleString()}</CardDescription>
          </div>
          <Badge variant={`status-${ticket.status}`}>
            {ticket.status.replace('_', ' ')}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">Assignment</h2>
            <div className="space-y-4">
              {canReassign && !isResolved ? (
                <>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium min-w-[3rem]">Team</p>
                    <Select
                      value={ticket.assigned_team_id || 'unassigned'}
                      onValueChange={handleTeamChange}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium min-w-[3rem]">Agent</p>
                    <Select
                      value={ticket.assigned_agent_id || 'unassigned'}
                      onValueChange={handleAgentChange}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Team: {ticketWithRelations.team?.name || 'Unassigned'}
                  </p>
                  <p className="text-muted-foreground">
                    Agent: {ticketWithRelations.assigned_agent?.full_name || 'Unassigned'}
                  </p>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">Categories</h2>
            <div className="flex gap-2">
              {(ticketWithRelations.categories || []).map((category) => (
                <Badge 
                  key={category.category_id}
                  variant="outline"
                >
                  {category.category_id}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">Watchers</h2>
            <div className="flex gap-2">
              {(ticketWithRelations.watchers || []).map((watcher) => (
                <Badge 
                  key={watcher.watcher_id}
                  variant="secondary"
                >
                  {watcher.watcher_type}: {watcher.watcher_id}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}); 