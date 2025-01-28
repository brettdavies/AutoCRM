import { useState } from 'react';
import type { UseTicketFormReturn, TicketFormData } from '../types/hook.types';
import logger from '@/shared/utils/logger.utils';

/**
 * Hook for managing ticket form state
 * @returns {UseTicketFormReturn} Object containing form state and update functions
 */
export function useTicketForm(): UseTicketFormReturn {
  const COMPONENT = 'useTicketForm';

  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    team_id: '',
    priority: 'medium',
    category_ids: [],
    attachments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof TicketFormData>(field: K, value: TicketFormData[K]) => {
    logger.debug(`[${COMPONENT}] Updating form field`, { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for the updated field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
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