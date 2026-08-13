// First-load placeholder. Static markup only, so it can never trigger a
// hydration mismatch; the real grid replaces it once the first fetch lands.
export function SeatMapSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2.5">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex items-center gap-2">
          <span className="h-3 w-5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: 8 }).map((_, column) => (
              <span
                key={column}
                className="h-8 w-8 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 sm:h-9 sm:w-9"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
