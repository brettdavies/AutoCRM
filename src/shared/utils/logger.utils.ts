const logger = {
  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(message, data || '');
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(message, error || '');
  },
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(message, data || '');
    }
  },
  warn: (message: string, data?: unknown) => {
    console.warn(message, data || '');
  },
  http: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log('[HTTP]', message, data || '');
    }
  }
};

export default logger; 