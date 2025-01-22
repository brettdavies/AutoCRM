import { useState, useEffect, useRef } from 'react';
import { useTickets } from '../hooks/useTickets';
import type { TicketStatus } from '../types/ticket.types';
import logger from '@/shared/utils/logger.utils';
import { formatDate } from '@/shared/utils/date.utils';

export interface TicketListProps {
  teamId?: string;
  agentId?: string;
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

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">{title}</h2>
        {!hideStatusFilter && (
          <select 
            value={statusFilter || ''} 
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus)}
            className="rounded border p-2"
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="under_review">Under Review</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {!filteredTickets?.length ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">No tickets found</div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => onTicketClick(ticket.id)}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedTicketId === ticket.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{ticket.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${ticket.status === 'escalated' ? 'bg-red-100 text-red-800' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-purple-100 text-purple-800'}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{ticket.team?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(ticket.updated_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.assigned_agent?.full_name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 