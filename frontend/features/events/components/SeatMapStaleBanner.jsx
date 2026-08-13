"use client";

import { useSeatMapStore } from "../store/seatMapStore";

// Shown only when the last poll failed while previous data is still displayed.
// Never a silent blank state: the map stays, but staleness is explicit.
export function SeatMapStaleBanner({ onRetry }) {
  const isStale = useSeatMapStore((s) => s.isStale);
  if (!isStale) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
      <span>The seat map may be out of date. Polling will keep retrying.</span>
      <button type="button" onClick={onRetry} className="shrink-0 underline">
        Retry now
      </button>
    </div>
  );
}
