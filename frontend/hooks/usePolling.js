"use client";

import { useEffect, useRef } from "react";

// Generic interval polling with an optional refetch on window focus. The
// callback is held in a ref so callers can pass an inline closure without
// restarting the timer on every render.
export function usePolling(callback, intervalMs, { enabled = true, refetchOnFocus = true } = {}) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const poll = () => callbackRef.current();
    const intervalId = setInterval(poll, intervalMs);
    if (refetchOnFocus) {
      window.addEventListener("focus", poll);
    }
    return () => {
      clearInterval(intervalId);
      if (refetchOnFocus) {
        window.removeEventListener("focus", poll);
      }
    };
  }, [enabled, intervalMs, refetchOnFocus]);
}
