/**
 * utils/retry.ts - 重试逻辑
 *
 * 对应真实 Claude Code: src/services/api/withRetry.ts
 * API 调用可能因网络或限流失败，自动重试提高可靠性。
 */

/**
 * 带指数退避的重试
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries) break;

      // 判断是否可重试
      if (!isRetryableError(error)) throw error;

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      onRetry?.(error, attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // 网络错误、限流、服务端错误可重试
    if (msg.includes("rate limit") || msg.includes("429")) return true;
    if (msg.includes("timeout") || msg.includes("econnreset")) return true;
    if (msg.includes("500") || msg.includes("502") || msg.includes("503")) return true;
    if (msg.includes("overloaded")) return true;
  }
  return false;
}
