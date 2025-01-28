import { useState } from 'react';
import type { TicketStatus, TicketWithRelations } from '../types/ticket.types';
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
  Button,
} from '@/shared/components';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'title' | 'status' | 'team' | 'updated_at' | 'created_at' | 'agent';
type SortOrder = 'asc' | 'desc' | 'off';

const TICKET_STATUSES: TicketStatus[] = [
  'unassigned',
  'in_progress',
  'under_review',
  'escalated',
  'resolved',
  'closed'
];

export interface TicketListProps {
  tickets: TicketWithRelations[];
  onTicketClick: (ticketId: string) => void;
  title: string;
  hideStatusFilter?: boolean;
  selectedTicketId?: string | null;
}

export function TicketList({
  tickets,
  onTicketClick,
  title,
  hideStatusFilter = false,
  selectedTicketId = null
}: TicketListProps) {
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Cycle through sort orders: asc -> desc -> off
      setSortOrder(current => {
        switch (current) {
          case 'asc': return 'desc';
          case 'desc': return 'off';
          case 'off': return 'asc';
        }
      });
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField || sortOrder === 'off') return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Filter and sort tickets
  const sortedTickets = [...tickets]
    .filter(ticket => !statusFilter || ticket.status === statusFilter)
    .sort((a, b) => {
      if (sortOrder === 'off') return 0;

      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'team':
          comparison = (a.team?.name || '').localeCompare(b.team?.name || '');
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'agent':
          comparison = (a.assigned_agent?.full_name || '').localeCompare(b.assigned_agent?.full_name || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {!hideStatusFilter && (
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value as TicketStatus)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {TICKET_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {!sortedTickets?.length ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-muted-foreground">No tickets found</div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('title')} className="cursor-pointer">
                    Title {getSortIcon('title')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                    Status {getSortIcon('status')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('team')} className="cursor-pointer">
                    Team {getSortIcon('team')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('created_at')} className="cursor-pointer">
                    Created {getSortIcon('created_at')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('updated_at')} className="cursor-pointer">
                    Updated {getSortIcon('updated_at')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('agent')} className="cursor-pointer">
                    Agent {getSortIcon('agent')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedTicketId === ticket.id ? 'bg-muted' : ''}`}
                    onClick={() => onTicketClick(ticket.id)}
                  >
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant={`status-${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.team?.name || 'Unassigned'}</TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>{formatDate(ticket.updated_at)}</TableCell>
                    <TableCell>{ticket.assigned_agent?.full_name || 'Unassigned'}</TableCell>
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