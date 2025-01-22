import { Button, TextField } from '@/shared/components';
import { TeamSelect } from './TeamSelect';

interface TicketCreationForm {
  title: string;
  description: string;
  team_id?: string;
  priority?: string;
  category_ids: string[];
  attachments?: File[];
}

interface TicketFormProps {
  formData: TicketCreationForm;
  errors: Partial<Record<keyof TicketCreationForm, string>>;
  isSubmitting: boolean;
  updateField: <K extends keyof TicketCreationForm>(field: K, value: TicketCreationForm[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function TicketForm({ 
  formData, 
  errors, 
  isSubmitting, 
  updateField, 
  onSubmit, 
  onCancel 
}: TicketFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <TextField
        id="title"
        name="title"
        label="Title"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        required
      />

      <TeamSelect
        value={formData.team_id}
        onChange={(value) => updateField('team_id', value)}
        error={errors.team_id}
      />

      {/* Rich text editor coming soon */}
      <div className="h-48 border rounded-md p-4 bg-gray-50">
        Rich text editor coming soon
      </div>

      {/* Category selection coming soon */}
      <div className="h-24 border rounded-md p-4 bg-gray-50">
        Category selection coming soon
      </div>

      {/* File upload coming soon */}
      <div className="h-24 border rounded-md p-4 bg-gray-50">
        File upload coming soon
      </div>

      {/* Priority selection coming soon */}
      <div className="h-24 border rounded-md p-4 bg-gray-50">
        Priority selection coming soon
      </div>

      <div className="flex justify-end space-x-4">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
} 