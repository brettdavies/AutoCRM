import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TicketList } from '../components/TicketList'
import { TicketDetails } from '../components/TicketDetails'
import { useAuth } from '@/features/auth'
import { useTickets } from '../hooks/useTickets'
import { ResponsivePanel, Button, ScrollArea, Card } from '@/shared/components'
import { XMarkIcon } from '@heroicons/react/24/outline'
import logger from '@/shared/utils/logger.utils'
import { ticketRoutes } from '../routes'

export function TicketManagement() {
  const { session } = useAuth()
  const navigate = useNavigate();
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
  
  // Fetch all tickets once
  const { tickets: allTickets, isLoading, error } = useTickets({
    userId: session?.user?.id,
    userTeamId: session?.user?.user_metadata?.team_id
  });

  // Filter tickets for each list
  const myTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets.filter(ticket => 
      ticket.assigned_agent?.id === session?.user?.id && 
      ticket.status !== 'unassigned'
    );
  }, [allTickets, session?.user?.id]);

  const unassignedTickets = useMemo(() => {
    if (!allTickets) return [];
    return allTickets.filter(ticket => ticket.status === 'unassigned');
  }, [allTickets]);
  
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

  const handleViewDetails = useCallback(() => {
    if (previewTicketId) {
      logger.debug('[TicketManagement] Navigating to ticket details', { ticketId: previewTicketId });
      navigate(ticketRoutes.view(previewTicketId));
    }
  }, [previewTicketId, navigate]);

  const handleClosePreview = useCallback(() => {
    setPreviewTicketId(null);
  }, []);

  // Memoize the ticket lists
  const myTicketsList = useMemo(() => (
    <ResponsivePanel
      mobileHeight="h-[calc(40vh-6rem)]"
      desktopHeight="lg:h-[calc(40vh-6rem)]"
      minHeight="min-h-[200px]"
    >
      <ScrollArea className="h-full">
        <TicketList
          tickets={myTickets}
          onTicketClick={handleTicketClick}
          title="My Tickets"
          hideStatusFilter={false}
          selectedTicketId={previewTicketId}
        />
      </ScrollArea>
    </ResponsivePanel>
  ), [myTickets, handleTicketClick, previewTicketId]);

  const unassignedTicketsList = useMemo(() => (
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
  ), [unassignedTickets, handleTicketClick, previewTicketId]);

  // Memoize the preview panel
  const previewPanel = useMemo(() => {
    if (!previewTicketId) return null;

    return (
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
    );
  }, [previewTicketId, handleClosePreview, handleViewDetails]);

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
          {myTicketsList}
          {unassignedTicketsList}
        </div>

        {previewPanel}
      </div>
    </div>
  );
} 