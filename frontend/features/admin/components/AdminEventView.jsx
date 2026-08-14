"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { SEAT_STATUS } from "@/lib/constants/seatStatus";
import { formatEventDate } from "@/lib/utils/format";
import { SeatGrid } from "@/ui/seat-grid/SeatGrid";

import { ADMIN_FLOW } from "../constants/adminFlowStatus";
import { useAdminBlockFlow } from "../hooks/useAdminBlockFlow";
import { useAdminBlockStore } from "../store/adminBlockStore";
import { AdminCountsGrid } from "./AdminCountsGrid";
import { AdminSeatGridLegend } from "./AdminSeatGridLegend";
import { BookingsTable } from "./BookingsTable";
import { SeatChangeApplyBar } from "./SeatChangeApplyBar";

// Stable module-level predicates: booked seats are genuinely non-interactive,
// blocked seats render as "toggled on". Being module-level keeps SeatCell's
// memo working (only the boolean results cross the memo boundary).
const adminIsDisabled = (seat) => seat.status === SEAT_STATUS.BOOKED;
const adminIsActive = (seat) => seat.status === SEAT_STATUS.BLOCKED;

// Composition layer for the admin event dashboard. All data arrives as props
// from the server component; this client view owns only the block/unblock
// selection, the apply flow, and the refetch trigger.
export function AdminEventView({ eventId, eventName, eventDate, dashboard, seats }) {
  const router = useRouter();

  const selectedSeatIds = useAdminBlockStore((s) => s.selectedSeatIds);
  const droppedSeatLabels = useAdminBlockStore((s) => s.droppedSeatLabels);
  const flowStatus = useAdminBlockStore((s) => s.flowStatus);
  const failedSeatLabels = useAdminBlockStore((s) => s.failedSeatLabels);
  const applyError = useAdminBlockStore((s) => s.applyError);
  const toggleSeat = useAdminBlockStore((s) => s.toggleSeat);
  const pruneBooked = useAdminBlockStore((s) => s.pruneBooked);
  const resetBlockStore = useAdminBlockStore((s) => s.reset);

  const { apply } = useAdminBlockFlow(eventId, seats, {
    onApplied: () => router.refresh(),
  });

  // The store is a module-level singleton, so a fresh event (navigation or
  // refresh of a different event id) must not leak the previous event's
  // selection or error state.
  useEffect(() => {
    resetBlockStore();
  }, [eventId, resetBlockStore]);

  // A pending seat that just became booked can't stay in the selection: it is
  // now disabled on the grid (so it could never be deselected by clicking) and
  // must never be sent to the block endpoint. Mirrors the booking store's
  // prune-on-poll behavior.
  useEffect(() => {
    const bookedIds = new Set(
      seats.filter((seat) => seat.status === SEAT_STATUS.BOOKED).map((seat) => seat.id),
    );
    const labelById = Object.fromEntries(
      seats.map((seat) => [seat.id, `${seat.row_label}${seat.seat_number}`]),
    );
    pruneBooked({ bookedIds, labelById });
  }, [seats, pruneBooked]);

  const statusById = useMemo(
    () => new Map(seats.map((seat) => [seat.id, seat.status])),
    [seats],
  );

  const toBlockCount = selectedSeatIds.filter(
    (id) => statusById.get(id) === SEAT_STATUS.AVAILABLE,
  ).length;
  const toUnblockCount = selectedSeatIds.filter(
    (id) => statusById.get(id) === SEAT_STATUS.BLOCKED,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{eventName}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{formatEventDate(eventDate)}</p>
      </div>

      <AdminCountsGrid dashboard={dashboard} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Seat blocking</h2>
          <AdminSeatGridLegend />
        </div>
        <SeatGrid
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={toggleSeat}
          isDisabled={adminIsDisabled}
          isActive={adminIsActive}
        />
        <SeatChangeApplyBar
          toBlockCount={toBlockCount}
          toUnblockCount={toUnblockCount}
          submitting={flowStatus === ADMIN_FLOW.SUBMITTING}
          failedSeatLabels={failedSeatLabels}
          applyError={applyError}
          droppedSeatLabels={droppedSeatLabels}
          onApply={apply}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <BookingsTable bookings={dashboard.bookings} />
      </section>
    </div>
  );
}
