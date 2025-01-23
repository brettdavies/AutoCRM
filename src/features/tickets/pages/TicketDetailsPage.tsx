import { useParams, useNavigate } from 'react-router-dom';
import { TicketDetails } from '../components/TicketDetails';
import { Card, ScrollArea } from '@/shared/components';
import { PageHeader } from '@/shared/components/PageHeader';
import { ticketRoutes } from '../routes';
import { useEffect } from 'react';
import logger from '@/shared/utils/logger.utils';

export function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ticketId) {
      logger.warn('[TicketDetailsPage] No ticket ID provided, redirecting to ticket list');
      navigate(ticketRoutes.list);
    }
  }, [ticketId, navigate]);

  if (!ticketId) {
    return null; // Return null while redirecting
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Details"
        description="View and manage ticket details"
        backLink={ticketRoutes.list}
      />
      
      <Card className="h-full">
        <ScrollArea className="h-full">
          <div className="p-6">
            <TicketDetails ticketId={ticketId} />
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

export default TicketDetailsPage; 