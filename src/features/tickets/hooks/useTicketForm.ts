import { useState } from 'react';
import { TicketCreationForm } from '../components/TicketForm';

export function useTicketForm() {
  const [formData, setFormData] = useState<TicketCreationForm>({
    title: '',
    description: '',
    team_id: '',
    priority: 'medium',
    category_ids: [],
    attachments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof TicketCreationForm>(
    field: K,
    value: TicketCreationForm[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    setErrors,
    setIsSubmitting
  };
} 