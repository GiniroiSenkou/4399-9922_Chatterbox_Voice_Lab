import { useCallback, useRef } from "react";

export function useDebouncedParam(fn: (value: number) => void, delay = 150) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (value: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(value), delay);
    },
    [fn, delay]
  );
}
