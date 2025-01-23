import React, { useState } from 'react';
import { useTicket } from '../hooks/useTicket';
import type { TicketStatus } from '../types/ticket.types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
} from '@/shared/components';

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
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={ticket.status === 'in_progress' ? 'outline' : 'default'}
              onClick={() => handleStatusChange('in_progress')}
              disabled={ticket.status === 'in_progress'}
            >
              Start Progress
            </Button>
            <Button
              variant={ticket.status === 'under_review' ? 'outline' : 'warning'}
              onClick={() => handleStatusChange('under_review')}
              disabled={ticket.status === 'under_review'}
            >
              Request Review
            </Button>
            <Button
              variant={ticket.status === 'escalated' ? 'outline' : 'destructive'}
              onClick={() => handleStatusChange('escalated')}
              disabled={ticket.status === 'escalated'}
            >
              Escalate
            </Button>
            <Button
              variant={ticket.status === 'resolved' ? 'outline' : 'success'}
              onClick={() => handleStatusChange('resolved')}
              disabled={ticket.status === 'resolved'}
            >
              Resolve
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {isAssigning ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentId">Agent ID</Label>
                <Input
                  id="agentId"
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamId">Team ID</Label>
                <Input
                  id="teamId"
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAssignment}>
                  Confirm Assignment
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAssigning(false);
                    setNewAgentId('');
                    setNewTeamId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAssigning(true)}>
              Assign Ticket
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Watcher Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Watchers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.watchers.map((watcher) => (
              <div key={watcher.watcher_id} className="flex justify-between items-center">
                <Badge variant="secondary">
                  {watcher.watcher_type}: {watcher.watcher_id}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveWatcher(watcher.watcher_id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleAddWatcher('AGENT_ID', 'agent')}
              >
                Add Agent Watcher
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddWatcher('TEAM_ID', 'team')}
              >
                Add Team Watcher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 