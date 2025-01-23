import { memo } from 'react';
import { useTicket } from '../hooks/useTicket';
import logger from '@/shared/utils/logger.utils';
import type { TicketHistory } from '../types/ticket.types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Separator,
  Badge,
} from '@/shared/components';

interface TicketDetailsProps {
  ticketId: string;
}

export const TicketDetails = memo(function TicketDetails({ ticketId }: TicketDetailsProps) {
  const { ticket, isLoading, error } = useTicket(ticketId);

  logger.debug('TicketDetails: Rendering with data:', {
    ticketId,
    ticket,
    isLoading,
    error,
    teamName: ticket?.team?.name
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

  const formatHistoryChange = (history: TicketHistory) => {
    switch (history.change_type) {
      case 'status':
        return `Status changed from ${history.old_value} to ${history.new_value}`;
      case 'assignment':
        return `Assigned to ${history.new_value}`;
      case 'category':
        return `Category updated to ${history.new_value}`;
      case 'description':
        return 'Description updated';
      default:
        return 'Unknown change';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escalated':
        return 'destructive';
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'progress';
      case 'under_review':
        return 'warning';
      case 'closed':
        return 'secondary';
      case 'unassigned':
        return 'unassigned';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{ticket.title}</CardTitle>
            <CardDescription>Created {new Date(ticket.created_at).toLocaleString()}</CardDescription>
          </div>
          <Badge variant={getStatusColor(ticket.status)}>
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
            <div className="text-muted-foreground">
              <p>Team: {ticket.team?.name || 'Unassigned'}</p>
              <p>Agent: {ticket.assigned_agent?.full_name || 'Unassigned'}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">Categories</h2>
            <div className="flex gap-2">
              {(ticket.categories || []).map((category) => (
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
              {(ticket.watchers || []).map((watcher) => (
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

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(ticket.history || []).map((historyItem) => (
            <div 
              key={historyItem.id}
              className="flex items-start space-x-3 text-sm"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  {historyItem.changed_by.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <p className="text-foreground">{formatHistoryChange(historyItem)}</p>
                <p className="text-muted-foreground">{new Date(historyItem.changed_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}); 