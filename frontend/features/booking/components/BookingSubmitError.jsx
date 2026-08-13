"use client";

export function BookingSubmitError({ message, onRetry }) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
      <p>{message ?? "Something went wrong. Please try again."}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-1 underline">
          Retry
        </button>
      )}
    </div>
  );
}
