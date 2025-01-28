const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  backoffMs: number
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) break;
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 100;
      const delay = (backoffMs * Math.pow(2, attempt - 1)) + jitter;
      await wait(delay);
    }
  }
  
  throw lastError;
} 