"use client";

// The apply control and the two status surfaces for the block/unblock flow:
// the prune notice (seats dropped because they became booked) and the failure
// banner (which seats failed and why, with the failed seats kept selected for
// retry).
export function SeatChangeApplyBar({
  toBlockCount,
  toUnblockCount,
  submitting,
  failedSeatLabels,
  applyError,
  droppedSeatLabels,
  onApply,
}) {
  const hasChanges = toBlockCount + toUnblockCount > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasChanges ? (
            <span>
              {toBlockCount > 0 && <span className="font-medium text-emerald-600">{toBlockCount} to block</span>}
              {toBlockCount > 0 && toUnblockCount > 0 && <span> · </span>}
              {toUnblockCount > 0 && <span className="font-medium text-amber-600">{toUnblockCount} to unblock</span>}
            </span>
          ) : (
            <span>Click seats on the map to block or unblock them.</span>
          )}
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={!hasChanges || submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Applying…" : "Apply changes"}
        </button>
      </div>

      {droppedSeatLabels.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {droppedSeatLabels.join(", ")}{" "}
          {droppedSeatLabels.length === 1 ? "was removed because it is" : "were removed because they are"} now
          booked.
        </div>
      )}

      {applyError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <p>
            Couldn&apos;t update {failedSeatLabels.join(", ")}: {applyError}
          </p>
          <p className="mt-1">
            {failedSeatLabels.length === 1 ? "This seat is" : "These seats are"} still selected. Try again.
          </p>
        </div>
      )}
    </div>
  );
}
