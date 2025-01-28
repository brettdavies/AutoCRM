import { logger } from '@/lib/logger';

/**
 * Gets the avatar URL for a user. This is now handled server-side, but this function
 * remains as a utility to format avatar URLs consistently across the application.
 */
export const getAvatarUrl = (email: string): string => {
  logger.debug('Getting avatar URL', { email });
  return ''; // Empty string will trigger the UI fallback to show initials
}; 
