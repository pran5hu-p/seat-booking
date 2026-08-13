import { SEAT_STATUS } from "@/lib/constants/seatStatus";

// Visual states are decided here, in one place:
// - Selected always wins over status, which is safe because the booking store
//   prunes any seat that stops being available, so a booked/blocked seat can
//   never still be in selectedSeatIds.
// - Booked and Blocked share the gray "unavailable" family but Blocked adds a
//   diagonal hatch (see .seat-blocked-hatch in globals.css) so the two are
//   distinguishable at a glance without a second color.
export const SEAT_CELL_BASE =
  "flex h-8 w-8 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors sm:h-9 sm:w-9 sm:text-xs";

export function seatColorClasses({ status, isSelected }) {
  if (isSelected) {
    return "border-emerald-600 bg-emerald-600 text-white";
  }
  switch (status) {
    case SEAT_STATUS.AVAILABLE:
      return "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-emerald-950";
    case SEAT_STATUS.BOOKED:
      return "border-zinc-300 bg-zinc-200 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500";
    case SEAT_STATUS.BLOCKED:
      return "seat-blocked-hatch border-zinc-300 bg-zinc-200 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500";
    default:
      return "border-zinc-300 bg-zinc-100 text-zinc-500";
  }
}

export function seatStateClasses({ status, isSelected }) {
  const isUnavailable = !isSelected && status !== SEAT_STATUS.AVAILABLE;
  return `${SEAT_CELL_BASE} ${seatColorClasses({ status, isSelected })} ${
    isUnavailable ? "cursor-not-allowed" : "cursor-pointer"
  }`;
}
