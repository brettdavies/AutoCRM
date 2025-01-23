import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/shared/components';
import { TicketForm } from '../components/TicketForm';
import { useTicketForm } from '../hooks/useTicketForm';
import { useTicket } from '../hooks/useTicket';
import logger from '@/shared/utils/logger.utils';
import { ticketRoutes } from '../routes';
import type { TicketCreationForm } from '../types/ticket.types';

export function TicketCreationPage() {
  const form = useTicketForm();
  const { createTicket } = useTicket();
  const navigate = useNavigate();

  const handleSubmit = async (formData: TicketCreationForm) => {
    logger.info('[TicketCreationPage] Starting ticket submission', {
      formData
    });

    try {
      form.setIsSubmitting(true);
      logger.debug('[TicketCreationPage] Validating form data');

      // Basic validation
      if (!formData.title.trim()) {
        logger.warn('[TicketCreationPage] Title is required');
        form.setErrors({ title: 'Title is required' });
        return;
      }

      if (!formData.team_id) {
        logger.warn('[TicketCreationPage] Team selection is required');
        form.setErrors({ team_id: 'Team selection is required' });
        return;
      }

      logger.debug('[TicketCreationPage] Form validation passed, creating ticket');
      const ticket = await createTicket(formData);
      
      logger.info('[TicketCreationPage] Ticket created successfully', {
        ticketId: ticket.id,
        title: formData.title
      });

      // Use React Router navigation with correct route
      navigate(ticketRoutes.view(ticket.id));
    } catch (error) {
      logger.error('[TicketCreationPage] Failed to create ticket', { error });
      form.setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create ticket'
      });
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Ticket"
        description="Create a new support ticket"
        backLink={ticketRoutes.list}
      />
      <Card className="p-6">
        <TicketForm
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}

export default TicketCreationPage; 