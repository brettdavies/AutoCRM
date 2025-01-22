import { useParams } from 'react-router-dom';
import { TicketDetails } from '../components/TicketDetails';
import { Panel, ScrollableContainer } from '@/shared/components';
import { PageHeader } from '@/shared/components/PageHeader';
import { ticketRoutes } from '../routes';

export function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Details"
        description="View and manage ticket details"
        backLink={ticketRoutes.list}
      />
      
      <Panel className="min-h-[500px]">
        <ScrollableContainer>
          <TicketDetails ticketId={id} />
        </ScrollableContainer>
      </Panel>
    </div>
  );
}

export default TicketDetailsPage; 