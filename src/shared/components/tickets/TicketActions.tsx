import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database.types'

type Ticket = Database['public']['Tables']['tickets']['Row']

interface TicketActionsProps {
  ticket: Ticket
  onAssign?: () => void
  onResolve?: () => void
  onDelete?: () => void
}

export function TicketActions({ 
  ticket, 
  onAssign, 
  onResolve, 
  onDelete 
}: TicketActionsProps) {
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

  return (
    <div className="flex gap-2">
      {showAssignButton && onAssign && (
        <button
          onClick={onAssign}
          className="btn btn-primary"
        >
          {isUnassigned ? 'Assign Ticket' : 'Reassign'}
        </button>
      )}

      {showResolveButton && onResolve && (
        <button
          onClick={onResolve}
          className="btn btn-success"
        >
          Resolve Ticket
        </button>
      )}

      {showDeleteButton && onDelete && (
        <button
          onClick={onDelete}
          className="btn btn-danger"
        >
          Delete Ticket
        </button>
      )}

      <div className="text-sm text-gray-500">
        Status: {ticket.status}
      </div>
    </div>
  )
} 