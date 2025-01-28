import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TicketList } from '../components/TicketList'
import { TicketDetails } from '../components/TicketDetails'
import { useAuth } from '@/features/auth'
import { useTickets } from '../hooks/useTickets'
import type { TicketWithRelations } from '../types/ticket.types'
import { ResponsivePanel, Button, ScrollArea, Card } from '@/shared/components'
import { XMarkIcon } from '@heroicons/react/24/outline'
import logger from '@/shared/utils/logger.utils'
import { ticketRoutes } from '../routes'

export function TicketManagement() {
  const { session, profile } = useAuth()
  const navigate = useNavigate();
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
  
  // Check if user is team lead
  const isTeamLead = profile?.user_role === 'agent' && session?.user?.user_metadata?.is_team_lead === 'true';
  const teamId = session?.user?.user_metadata?.team_id;
  
  // Fetch all tickets once
  const { tickets: allTickets, isLoading, error } = useTickets({
    teamId,
    userRole: profile?.user_role
  });

  // Filter tickets for each list
  const myTickets = useMemo(() => {
    if (!allTickets) return [];
    
    // Admins see all tickets
    if (profile?.user_role === 'admin') {
      return (allTickets as TicketWithRelations[]).filter(ticket => ticket.status !== 'unassigned');
    }
    
    // For team leads, show all team tickets
    if (isTeamLead && teamId) {
      return (allTickets as TicketWithRelations[]).filter(ticket => 
        ticket.assigned_team_id === teamId && 
        ticket.status !== 'unassigned'
      );
    }
    
    // For agents, show assigned tickets
    if (profile?.user_role === 'agent') {
      return (allTickets as TicketWithRelations[]).filter(ticket => 
        ticket.assigned_agent?.id === session?.user?.id && 
        ticket.status !== 'unassigned'
      );
    }
    
    // For customers, show created tickets
    return (allTickets as TicketWithRelations[]).filter(ticket => 
      ticket.created_by === session?.user?.id
    );
  }, [allTickets, session?.user?.id, profile?.user_role, isTeamLead, teamId]);

  const unassignedTickets = useMemo(() => {
    if (!allTickets) return [];

    // Admins see all unassigned tickets
    if (profile?.user_role === 'admin') {
      return (allTickets as TicketWithRelations[]).filter(ticket => ticket.status === 'unassigned');
    }

    // Only show unassigned tickets to agents and team leads
    if (profile?.user_role !== 'agent') return [];
    
    // For team leads, show unassigned tickets for their team
    if (isTeamLead && teamId) {
      return (allTickets as TicketWithRelations[]).filter(ticket => 
        ticket.status === 'unassigned' && 
        ticket.assigned_team_id === teamId
      );
    }

    return (allTickets as TicketWithRelations[]).filter(ticket => ticket.status === 'unassigned');
  }, [allTickets, profile?.user_role, isTeamLead, teamId]);
  
  // Refs for dimension tracking
  const gridRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const myTicketsRef = useRef<HTMLDivElement>(null)
  const unassignedRef = useRef<HTMLDivElement>(null)

  // Log dimensions
  const logDimensions = (phase: string) => {
    const grid = gridRef.current?.getBoundingClientRect()
    const leftPanel = leftPanelRef.current?.getBoundingClientRect()
    const myTickets = myTicketsRef.current?.getBoundingClientRect()
    const unassigned = unassignedRef.current?.getBoundingClientRect()

    logger.debug(`[Layout ${phase}] Dimensions:`, {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      grid: {
        height: grid?.height,
        top: grid?.top,
        bottom: grid?.bottom
      },
      leftPanel: {
        height: leftPanel?.height,
        top: leftPanel?.top,
        bottom: leftPanel?.bottom
      },
      myTickets: {
        height: myTickets?.height,
        top: myTickets?.top,
        bottom: myTickets?.bottom
      },
      unassigned: {
        height: unassigned?.height,
        top: unassigned?.top,
        bottom: unassigned?.bottom
      }
    })
  }

  // Log on mount and updates
  useEffect(() => {
    logDimensions('Initial')
    
    // Log after initial render
    const timer = setTimeout(() => {
      logDimensions('Post-render')
    }, 0)

    // Create mutation observer to track size changes
    const observer = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        const elem = entry.target as HTMLElement
        logger.debug('[Layout Change] Element resized:', {
          id: elem.id,
          height: entry.contentRect.height,
          timestamp: new Date().toISOString()
        })
      })
    })

    // Observe key elements
    ;[gridRef, leftPanelRef, myTicketsRef, unassignedRef].forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const handleTicketClick = useCallback((ticketId: string) => {
    setPreviewTicketId(ticketId === previewTicketId ? null : ticketId);
  }, [previewTicketId]);

  const handleClosePreview = useCallback(() => {
    setPreviewTicketId(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (previewTicketId) {
      navigate(ticketRoutes.view(previewTicketId));
    }
  }, [navigate, previewTicketId]);

  // Show loading state
  if (isLoading) {
    return <div className="p-4">Loading tickets...</div>;
  }

  // Show error state
  if (error) {
    return <div className="p-4 text-red-500">Error loading tickets: {error.message}</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ticket Management</h1>
        <Button variant="default" onClick={() => navigate(ticketRoutes.create)}>
          Create Ticket
        </Button>
      </div>

      <div className={`flex-1 grid gap-2 ${
        previewTicketId 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-1'
      }`}>
        <div className="space-y-2">
          <ResponsivePanel
            mobileHeight="h-[calc(40vh-6rem)]"
            desktopHeight="lg:h-[calc(40vh-6rem)]"
            minHeight="min-h-[200px]"
          >
            <ScrollArea className="h-full">
              <TicketList
                tickets={myTickets}
                onTicketClick={handleTicketClick}
                title={profile?.user_role === 'admin' ? "All Tickets" : isTeamLead ? "My Team's Tickets" : "My Tickets"}
                hideStatusFilter={false}
                selectedTicketId={previewTicketId}
              />
            </ScrollArea>
          </ResponsivePanel>

          {(profile?.user_role === 'admin' || profile?.user_role === 'agent') && (
            <ResponsivePanel
              mobileHeight="h-[calc(40vh-6rem)]"
              desktopHeight="lg:h-[calc(40vh-6rem)]"
              minHeight="min-h-[200px]"
            >
              <ScrollArea className="h-full">
                <TicketList
                  tickets={unassignedTickets}
                  onTicketClick={handleTicketClick}
                  title="Unassigned Tickets"
                  hideStatusFilter={true}
                  selectedTicketId={previewTicketId}
                />
              </ScrollArea>
            </ResponsivePanel>
          )}
        </div>

        {previewTicketId && (
          <Card className="h-[calc(80vh-8rem)]">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ticket Preview</h2>
              <Button variant="default" onClick={handleClosePreview}>
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-5rem)]">
              <div className="space-y-4">
                <TicketDetails ticketId={previewTicketId} />
                <div className="flex justify-end px-4 pb-4">
                  <Button variant="default" onClick={handleViewDetails}>
                    View Full Details
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
} 