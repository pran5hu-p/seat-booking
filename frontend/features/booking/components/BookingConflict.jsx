"use client";

export function BookingConflict({ detail }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-semibold">Some seats are no longer available</p>
      {detail && <p className="mt-1">{detail}</p>}
      <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
        The seat map was refreshed — select remaining seats to continue.
      </p>
    </div>
  );
}
