import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TicketList } from '../components/TicketList'
import { TicketDetails } from '../components/TicketDetails'
import { useAuth } from '@/features/auth'
import { ResponsivePanel, Button, Panel, ScrollableContainer } from '@/shared/components'
import { XMarkIcon } from '@heroicons/react/24/outline'
import logger from '@/shared/utils/logger.utils'
import { ticketRoutes } from '../routes'

export function TicketManagement() {
  const { session } = useAuth()
  const navigate = useNavigate();
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
  
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

  const handleTicketClick = (ticketId: string) => {
    setPreviewTicketId(ticketId === previewTicketId ? null : ticketId);
  }

  const handleViewDetails = () => {
    if (previewTicketId) {
      navigate(ticketRoutes.view(previewTicketId));
    }
  }

  const handleClosePreview = () => {
    setPreviewTicketId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
          <div className="text-sm text-gray-500">
            Logged in as: {session?.user?.email}
          </div>
        </div>
        <Link to={ticketRoutes.create}>
          <Button variant="primary">Create Ticket</Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className={`grid gap-6 transition-all duration-200 ${previewTicketId ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Left Column - Ticket Lists */}
        <div className={`space-y-6 ${previewTicketId ? 'lg:col-span-2' : 'lg:col-span-full'}`}>
          {/* My Tickets */}
          <ResponsivePanel>
            <div className="h-[calc(40vh-4rem)] overflow-hidden">
              <ScrollableContainer>
                <TicketList
                  teamId={undefined}
                  agentId={session?.user?.id}
                  onTicketClick={handleTicketClick}
                  title="My Tickets"
                  excludeStatus="unassigned"
                  hideStatusFilter={false}
                  selectedTicketId={previewTicketId}
                />
              </ScrollableContainer>
            </div>
          </ResponsivePanel>

          {/* Unassigned Tickets */}
          <ResponsivePanel>
            <div className="h-[calc(40vh-4rem)] overflow-hidden">
              <ScrollableContainer>
                <TicketList
                  teamId={undefined}
                  agentId={undefined}
                  onTicketClick={handleTicketClick}
                  title="Unassigned Tickets"
                  status="unassigned"
                  hideStatusFilter={true}
                  selectedTicketId={previewTicketId}
                />
              </ScrollableContainer>
            </div>
          </ResponsivePanel>
        </div>

        {/* Right Column - Ticket Preview */}
        {previewTicketId && (
          <Panel className="h-[calc(80vh-4rem)] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ticket Preview</h2>
              <button
                onClick={handleClosePreview}
                className="p-1 rounded-md hover:bg-gray-100"
                aria-label="Close preview"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <ScrollableContainer>
              <div className="space-y-4">
                <TicketDetails ticketId={previewTicketId} />
                <div className="flex justify-end px-4 pb-4">
                  <Button variant="primary" onClick={handleViewDetails}>
                    View Full Details
                  </Button>
                </div>
              </div>
            </ScrollableContainer>
          </Panel>
        )}
      </div>
    </div>
  )
} 