import React, { useState } from 'react'
import { TicketList } from '../components/TicketList'
import { TicketDetails } from '../components/TicketDetails'
import { useAuth } from '@/features/auth'

export function TicketManagement() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const { session } = useAuth()

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId)
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
        <div className="text-sm text-gray-500">
          Logged in as: {session?.user?.email}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket List */}
        <div className="bg-white shadow rounded-lg p-6">
          <TicketList
            teamId={undefined}
            agentId={undefined}
            onTicketClick={handleTicketClick}
          />
        </div>

        {/* Ticket Details */}
        <div className="bg-white shadow rounded-lg p-6">
          {selectedTicketId ? (
            <TicketDetails ticketId={selectedTicketId} />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 