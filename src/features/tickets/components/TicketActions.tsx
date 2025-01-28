import { useAuth } from '@/features/auth/hooks/useAuth'
import { useTicket } from '@/features/tickets/hooks/useTicket'
import {
  Button
} from '@/shared/components'

interface TicketActionsProps {
  ticketId: string
  onActionComplete?: () => void
}

export function TicketActions({ ticketId, onActionComplete }: TicketActionsProps) {
  const {
    ticket,
    isLoading,
    error
  } = useTicket(ticketId)

  const { 
    isAdmin,
    isAgent
  } = useAuth()

  // Return null if user can't view tickets
  if (!isAgent && !isAdmin) {
    return null
  }

  if (isLoading) return <div className="text-muted-foreground">Loading actions...</div>
  if (error) return <div className="text-destructive">Error loading actions: {error.message}</div>
  if (!ticket) return null

  const canManage = isAgent || isAdmin
  const isUnassigned = !ticket.assigned_team_id
  const showAssignButton = isUnassigned || isAdmin
  const showResolveButton = canManage && !ticket.status.includes('resolved')
  const showDeleteButton = isAdmin

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