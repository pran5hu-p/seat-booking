"use client";

export function SeatMapError({ message, onRetry }) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-6 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
      <p>{message ?? "Failed to load the seat map."}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md border border-current px-3 py-1.5 font-medium"
      >
        Try again
      </button>
    </div>
  );
}
