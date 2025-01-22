import { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import type { TicketStatus } from '../types/ticket.types';

interface TicketListProps {
  teamId?: string;
  agentId?: string;
  onTicketClick: (ticketId: string) => void;
}

export function TicketList({ teamId, agentId, onTicketClick }: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>();
  
  const { tickets, isLoading, error } = useTickets({
    teamId,
    agentId,
    status: statusFilter
  });

  if (isLoading) return <div>Loading tickets...</div>;
  if (error) return <div>Error loading tickets: {error.message}</div>;
  if (!tickets?.length) return <div>No tickets found</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tickets</h2>
        <select 
          value={statusFilter || ''} 
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus)}
          className="rounded border p-2"
        >
          <option value="">All Statuses</option>
          <option value="unassigned">Unassigned</option>
          <option value="in_progress">In Progress</option>
          <option value="under_review">Under Review</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
            {tickets.map((ticket) => (
              <tr 
                key={ticket.id} 
                onClick={() => onTicketClick(ticket.id)}
                className="hover:bg-gray-50 cursor-pointer"
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
                <td className="px-6 py-4 whitespace-nowrap">{new Date(ticket.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(ticket.updated_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ticket.assigned_agent?.full_name || 'Unassigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 