import { useState, useEffect, useRef } from 'react';
import { useTickets } from '../hooks/useTickets';
import type { TicketStatus } from '../types/ticket.types';
import logger from '@/shared/utils/logger.utils';
import { formatDate } from '@/shared/utils/date.utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '@/shared/components';

export interface TicketListProps {
  teamId?: string | undefined;
  agentId?: string | undefined;
  status?: TicketStatus;
  excludeStatus?: TicketStatus;
  onTicketClick: (ticketId: string) => void;
  title: string;
  hideStatusFilter?: boolean;
  selectedTicketId?: string | null;
}

export function TicketList({
  teamId,
  agentId,
  status,
  excludeStatus,
  onTicketClick,
  title,
  hideStatusFilter = false,
  selectedTicketId = null
}: TicketListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(status);

  const logListDimensions = (phase: string) => {
    const container = containerRef.current?.getBoundingClientRect();
    const table = tableRef.current?.getBoundingClientRect();
    const tableRows = tableRef.current?.querySelectorAll('tr');

    logger.debug(`[TicketList ${title} ${phase}] Dimensions:`, {
      container: {
        height: container?.height,
        scrollHeight: containerRef.current?.scrollHeight,
        clientHeight: containerRef.current?.clientHeight
      },
      table: {
        height: table?.height,
        rows: tableRows?.length,
        scrollHeight: tableRef.current?.scrollHeight,
        clientHeight: tableRef.current?.clientHeight
      }
    });
  };

  logger.debug('[TicketList] Rendering with props:', {
    teamId,
    agentId,
    status,
    excludeStatus,
    title,
    hideStatusFilter
  });

  const { tickets, isLoading, error } = useTickets({ teamId, agentId, status: hideStatusFilter ? status : statusFilter });

  // Log dimensions when tickets change
  useEffect(() => {
    if (tickets) {
      logListDimensions('After Data Load');
    }
  }, [tickets]);

  logger.debug('[TicketList] Raw tickets from useTickets:', {
    count: tickets?.length,
    tickets: tickets?.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      assigned_agent: t.assigned_agent?.id
    }))
  });

  if (isLoading) {
    logger.debug('[TicketList] Loading tickets...');
    return <div>Loading tickets...</div>;
  }

  if (error) {
    logger.error('[TicketList] Error loading tickets:', error);
    return <div>Error loading tickets: {error.message}</div>;
  }

  // Filter out excluded status if specified
  const filteredTickets = excludeStatus 
    ? tickets?.filter(ticket => ticket.status !== excludeStatus)
    : tickets;

  logger.debug('[TicketList] Filtered tickets:', {
    excludeStatus,
    beforeCount: tickets?.length,
    afterCount: filteredTickets?.length,
    filteredTickets: filteredTickets?.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      assigned_agent: t.assigned_agent?.id
    }))
  });

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
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">{title}</h2>
        {!hideStatusFilter && (
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value as TicketStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {!filteredTickets?.length ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-muted-foreground">No tickets found</div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <Table ref={tableRef}>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    onClick={() => onTicketClick(ticket.id)}
                    className={`cursor-pointer ${selectedTicketId === ticket.id ? 'bg-blue-50' : ''}`}
                  >
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.team?.name || 'Unassigned'}</TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>{formatDate(ticket.updated_at)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.assigned_agent?.full_name || 'Unassigned'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
} 