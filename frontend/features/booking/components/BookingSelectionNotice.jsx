"use client";

// Surfaced when a background poll removed seats from the user's selection.
// The change is never silent: the seat flips to its unavailable style on the
// grid and this notice explains what happened.
export function BookingSelectionNotice({ labels }) {
  if (labels.length === 0) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
      {labels.join(", ")}{" "}
      {labels.length === 1
        ? "became unavailable and was removed"
        : "became unavailable and were removed"}{" "}
      from your selection.
    </div>
  );
}
