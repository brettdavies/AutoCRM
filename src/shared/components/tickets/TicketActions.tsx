import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database.types'
import { useTicket } from '@/features/tickets/hooks/useTicket'
import type { TicketStatus } from '@/features/tickets/types/ticket.types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
} from '@/shared/components'

type Ticket = Database['public']['Tables']['tickets']['Row']

interface TicketActionsProps {
  ticketId: string
  onActionComplete?: () => void
}

export function TicketActions({ ticketId, onActionComplete }: TicketActionsProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [newAgentId, setNewAgentId] = useState('')
  const [newTeamId, setNewTeamId] = useState('')
  
  const {
    ticket,
    isLoading,
    error,
    updateStatus,
    assignTicket,
    addWatcher,
    removeWatcher
  } = useTicket(ticketId)

  const { 
    isAdmin,
    isAgent,
    canManageTicket,
    hasPermission
  } = useAuth()

  // Return null if user can't manage tickets at all
  if (!hasPermission('canViewTickets')) {
    return null
  }

  const canManage = canManageTicket(ticket.team_id ?? null)
  const isUnassigned = !ticket.assigned_to_id
  const showAssignButton = isUnassigned || isAdmin
  const showResolveButton = canManage && !ticket.status.includes('resolved')
  const showDeleteButton = isAdmin

  if (isLoading) return <div className="text-muted-foreground">Loading actions...</div>
  if (error) return <div className="text-destructive">Error loading actions: {error.message}</div>
  if (!ticket) return null

  return (
    <div className="flex gap-2">
      {showAssignButton && onActionComplete && (
        <Button
          onClick={onActionComplete}
          variant="default"
        >
          {isUnassigned ? 'Assign Ticket' : 'Reassign'}
        </Button>
      )}

      {showResolveButton && onActionComplete && (
        <Button
          onClick={onActionComplete}
          variant="default"
        >
          Resolve Ticket
        </Button>
      )}

      {showDeleteButton && onActionComplete && (
        <Button
          onClick={onActionComplete}
          variant="destructive"
        >
          Delete Ticket
        </Button>
      )}

      <div className="text-sm text-muted-foreground">
        Status: {ticket.status}
      </div>
    </div>
  )
} 