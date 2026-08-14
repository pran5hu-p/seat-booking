import { SEAT_STATUS } from "@/lib/constants/seatStatus";

// Visual states are decided here, in one place. Precedence per cell:
// 1. Pending selection (isSelected) always wins. Safe because the booking
//    store prunes any seat that stops being available, and the admin view
//    clears its pending selection after every submit/refetch.
// 2. isActive (a seat the caller marks as currently toggled on, e.g. blocked
//    in admin mode) renders a distinct engaged style. It must look neither
//    like a pending selection nor like a passive unavailable seat, because an
//    already-blocked seat has to be visually separable from one merely clicked
//    for a pending unblock.
// 3. Status-based fallback. Booked and Blocked share the gray "unavailable"
//    family but Blocked adds a diagonal hatch (see .seat-blocked-hatch in
//    globals.css) so the two are distinguishable at a glance without a second
//    color.
export const SEAT_CELL_BASE =
  "flex h-8 w-8 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors sm:h-9 sm:w-9 sm:text-xs";

export function seatColorClasses({ status, isSelected, isActive = false }) {
  if (isSelected) {
    return "border-emerald-600 bg-emerald-600 text-white";
  }
  if (isActive) {
    return "seat-blocked-hatch border-emerald-500 bg-emerald-100 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300";
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

// Cursor mirrors the disabled attribute one-to-one: a disabled cell gets
// cursor-not-allowed, every clickable cell gets cursor-pointer. The caller's
// isDisabled predicate is the single source of truth for interactivity.
export function seatStateClasses({ status, isSelected, isActive = false, isDisabled = false }) {
  return `${SEAT_CELL_BASE} ${seatColorClasses({ status, isSelected, isActive })} ${
    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
  }`;
}
