import { PageHeader } from '@/shared/components/PageHeader';
import { Panel } from '@/shared/components/Panel';
import { TicketForm } from '../components/TicketForm';
import { useTicketForm } from '../hooks/useTicketForm';
import { useTicket } from '../hooks/useTicket';
import logger from '@/shared/utils/logger.utils';
import { useNavigate } from 'react-router-dom';
import { ticketRoutes } from '../routes';

export function TicketCreationPage() {
  const form = useTicketForm();
  const { createTicket } = useTicket();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('[TicketCreationPage] Starting ticket submission', {
      formData: form.formData
    });

    try {
      form.setIsSubmitting(true);
      logger.debug('[TicketCreationPage] Validating form data');

      // Basic validation
      if (!form.formData.title.trim()) {
        logger.warn('[TicketCreationPage] Title is required');
        form.setErrors({ title: 'Title is required' });
        return;
      }

      if (!form.formData.team_id) {
        logger.warn('[TicketCreationPage] Team selection is required');
        form.setErrors({ team_id: 'Team selection is required' });
        return;
      }

      logger.debug('[TicketCreationPage] Form validation passed, creating ticket');
      const ticket = await createTicket(form.formData);
      
      logger.info('[TicketCreationPage] Ticket created successfully', {
        ticketId: ticket.id,
        title: form.formData.title
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
    <div className="container mx-auto p-6 max-w-4xl">
      <PageHeader
        title="Create New Ticket"
        description="Submit a new support request"
        backLink={ticketRoutes.list}
      />
      <Panel className="mt-6">
        <div className="p-6">
          <TicketForm
            {...form}
            onSubmit={handleSubmit}
          />
        </div>
      </Panel>
    </div>
  );
}

export default TicketCreationPage; 