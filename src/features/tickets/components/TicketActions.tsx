import React, { useState } from 'react';
import { useTicket } from '../hooks/useTicket';
import type { TicketStatus } from '../types/ticket.types';

interface TicketActionsProps {
  ticketId: string;
  onActionComplete?: () => void;
}

export function TicketActions({ ticketId, onActionComplete }: TicketActionsProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  
  const {
    ticket,
    isLoading,
    error,
    updateStatus,
    assignTicket,
    addWatcher,
    removeWatcher
  } = useTicket(ticketId);

  if (isLoading) return <div>Loading actions...</div>;
  if (error) return <div>Error loading actions: {error.message}</div>;
  if (!ticket) return null;

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateStatus({ ticketId, status });
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssignment = async () => {
    if (!newAgentId || !newTeamId) return;
    
    try {
      await assignTicket({ ticketId, agentId: newAgentId, teamId: newTeamId });
      setIsAssigning(false);
      setNewAgentId('');
      setNewTeamId('');
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  const handleAddWatcher = async (watcherId: string, watcherType: 'team' | 'agent') => {
    try {
      await addWatcher({ ticketId, watcherId, watcherType });
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to add watcher:', err);
    }
  };

  const handleRemoveWatcher = async (watcherId: string) => {
    try {
      await removeWatcher({ ticketId, watcherId });
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to remove watcher:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Update Status</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStatusChange('in_progress')}
            disabled={ticket.status === 'in_progress'}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${ticket.status === 'in_progress' 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Start Progress
          </button>
          <button
            onClick={() => handleStatusChange('under_review')}
            disabled={ticket.status === 'under_review'}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${ticket.status === 'under_review'
                ? 'bg-yellow-300 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700'}`}
          >
            Request Review
          </button>
          <button
            onClick={() => handleStatusChange('escalated')}
            disabled={ticket.status === 'escalated'}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${ticket.status === 'escalated'
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'}`}
          >
            Escalate
          </button>
          <button
            onClick={() => handleStatusChange('resolved')}
            disabled={ticket.status === 'resolved'}
            className={`px-4 py-2 rounded-md text-white font-medium
              ${ticket.status === 'resolved'
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'}`}
          >
            Resolve
          </button>
        </div>
      </div>

      {/* Assignment Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Assignment</h3>
        {isAssigning ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent ID</label>
              <input
                type="text"
                value={newAgentId}
                onChange={(e) => setNewAgentId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team ID</label>
              <input
                type="text"
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm Assignment
              </button>
              <button
                onClick={() => {
                  setIsAssigning(false);
                  setNewAgentId('');
                  setNewTeamId('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAssigning(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Assign Ticket
          </button>
        )}
      </div>

      {/* Watcher Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Watchers</h3>
        <div className="space-y-4">
          {ticket.watchers.map((watcher) => (
            <div key={watcher.watcher_id} className="flex justify-between items-center">
              <span>
                {watcher.watcher_type}: {watcher.watcher_id}
              </span>
              <button
                onClick={() => handleRemoveWatcher(watcher.watcher_id)}
                className="px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex space-x-2">
            <button
              onClick={() => handleAddWatcher('AGENT_ID', 'agent')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Add Agent Watcher
            </button>
            <button
              onClick={() => handleAddWatcher('TEAM_ID', 'team')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              Add Team Watcher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 