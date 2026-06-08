import { useState, useCallback } from 'react';

/**
 * useRequestLock
 * Enterprise-grade request locking mechanism to prevent duplicate API executions
 * caused by rapid double-clicks or browser race conditions.
 */
export function useRequestLock() {
  const [isLocked, setIsLocked] = useState(false);

  const withLock = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T | undefined> => {
    if (isLocked) {
      console.warn("RequestLock: Blocked duplicate execution.");
      return undefined;
    }

    setIsLocked(true);
    try {
      return await asyncFn();
    } finally {
      setIsLocked(false);
    }
  }, [isLocked]);

  return {
    isLocked,
    withLock,
    setIsLocked // Manual escape hatch if needed
  };
}
