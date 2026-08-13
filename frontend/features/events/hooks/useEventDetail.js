"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getEventDetail } from "../services/eventService";
import { useSeatMapStore } from "../store/seatMapStore";

// Fetch + poll state for one event's detail. The seat-map data itself is
// hook-local; only the polling freshness metadata lives in the zustand store.
// loading is true only for the initial load: a poll that fails while data is
// still on screen marks the map stale instead of dropping to an error screen.
export function useEventDetail(eventId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const markRefreshing = useSeatMapStore((s) => s.markRefreshing);
  const markFresh = useSeatMapStore((s) => s.markFresh);
  const markStale = useSeatMapStore((s) => s.markStale);
  // Tracks whether any fetch has succeeded for the current eventId, which
  // decides between "show an error" (nothing to show yet) and "mark stale"
  // (keep showing what we have). Reset when eventId changes.
  const hasDataRef = useRef(false);

  const refetch = useCallback(async () => {
    markRefreshing();
    const result = await getEventDetail(eventId);
    if (result.ok) {
      hasDataRef.current = true;
      setData(result.data);
      setError(null);
      markFresh();
    } else if (hasDataRef.current) {
      markStale();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [eventId, markRefreshing, markFresh, markStale]);

  useEffect(() => {
    let cancelled = false;
    hasDataRef.current = false;
    markRefreshing();
    getEventDetail(eventId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        hasDataRef.current = true;
        setData(result.data);
        setError(null);
        markFresh();
      } else if (hasDataRef.current) {
        markStale();
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, markRefreshing, markFresh, markStale]);

  return { data, loading, error, refetch };
}
