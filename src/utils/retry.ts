export async function retry<T>(
  operation: () => Promise<T>,
  options: { attempts: number; baseDelayMs: number; shouldRetry?: (error: unknown) => boolean }
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const shouldRetry = options.shouldRetry?.(error) ?? true;
      if (!shouldRetry || attempt === options.attempts) break;
      const jitter = Math.floor(Math.random() * 50);
      await new Promise((resolve) => setTimeout(resolve, options.baseDelayMs * attempt + jitter));
    }
  }
  throw lastError;
}
