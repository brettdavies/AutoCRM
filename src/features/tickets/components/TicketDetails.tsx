import { useTicket } from '../hooks/useTicket';
import type { TicketHistory } from '../types/ticket.types';

interface TicketDetailsProps {
  ticketId: string;
}

export function TicketDetails({ ticketId }: TicketDetailsProps) {
  const { 
    ticket, 
    isLoading, 
    error,
  } = useTicket(ticketId);

  console.log('TicketDetails: Rendering with data:', {
    ticketId,
    ticket,
    isLoading,
    error,
    teamName: ticket?.team?.name,
    agentName: ticket?.assigned_agent?.full_name
  });

  if (isLoading) return <div>Loading ticket details...</div>;
  if (error) return <div>Error loading ticket: {error.message}</div>;
  if (!ticket) return <div>Ticket not found</div>;

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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-gray-500">Created {new Date(ticket.created_at).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold
            ${ticket.status === 'escalated' ? 'bg-red-100 text-red-800' :
              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
              ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              ticket.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
              ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
              'bg-purple-100 text-purple-800'}`}
          >
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Assignment</h2>
          <div className="text-gray-700">
            <p>Team: {ticket.team?.name || 'Unassigned'}</p>
            <p>Agent: {ticket.assigned_agent?.full_name || 'Unassigned'}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Categories</h2>
          <div className="flex gap-2">
            {(ticket.categories || []).map((category) => (
              <span 
                key={category.category_id}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {category.category_id}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Watchers</h2>
          <div className="flex gap-2">
            {(ticket.watchers || []).map((watcher) => (
              <span 
                key={watcher.watcher_id}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                {watcher.watcher_type}: {watcher.watcher_id}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">History</h2>
        <div className="space-y-4">
          {(ticket.history || []).map((historyItem) => (
            <div 
              key={historyItem.id}
              className="flex items-start space-x-3 text-sm"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {historyItem.changed_by.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <p className="text-gray-900">{formatHistoryChange(historyItem)}</p>
                <p className="text-gray-500">{new Date(historyItem.changed_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 