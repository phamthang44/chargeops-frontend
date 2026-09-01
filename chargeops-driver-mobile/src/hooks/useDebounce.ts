import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly changing value (such as search text input).
 * @param value The value to debounce.
 * @param delayMs Delay in milliseconds before updating debounced value (default: 350ms).
 */
export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
