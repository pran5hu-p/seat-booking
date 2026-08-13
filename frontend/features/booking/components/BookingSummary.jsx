"use client";

import { useBookingStore } from "../store/bookingStore";

export function BookingSummary() {
  const selectedCount = useBookingStore((s) => s.selectedSeatIds.length);

  if (selectedCount === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
        Select seats on the map to start your booking.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
        {selectedCount} seat{selectedCount === 1 ? "" : "s"} selected
      </p>
    </div>
  );
}
