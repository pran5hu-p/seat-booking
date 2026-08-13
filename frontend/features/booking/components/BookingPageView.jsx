"use client";

import { useEffect } from "react";

import { SEAT_STATUS } from "@/lib/constants/seatStatus";
import { usePolling } from "@/hooks/usePolling";
import { SeatMapPanel } from "@/features/events/components/SeatMapPanel";
import { useEventDetail } from "@/features/events/hooks/useEventDetail";
import { useSeatMapStore } from "@/features/events/store/seatMapStore";

import { useBookingStore } from "../store/bookingStore";
import { BookingPanel } from "./BookingPanel";

const SEAT_MAP_POLL_INTERVAL_MS = 7000;

// Composition layer: owns the seat-map fetch/poll, wires the two stores
// together (poll pruning), and lays out the seat map next to the booking
// panel. Everything it renders is a thin presentational component.
export function BookingPageView({ eventId }) {
  const { data, loading, error, refetch } = useEventDetail(eventId);

  const selectedSeatIds = useBookingStore((s) => s.selectedSeatIds);
  const toggleSeat = useBookingStore((s) => s.toggleSeat);
  const clearSelection = useBookingStore((s) => s.clearSelection);
  const resetFlow = useBookingStore((s) => s.resetFlow);
  const pruneUnavailable = useBookingStore((s) => s.pruneUnavailable);
  const resetPollingStatus = useSeatMapStore((s) => s.resetPollingStatus);

  usePolling(refetch, SEAT_MAP_POLL_INTERVAL_MS, { refetchOnFocus: true });

  // The stores are module-level singletons, so remounting (navigation between
  // events, keyed by eventId) must not leak the previous event's state.
  useEffect(() => {
    clearSelection();
    resetFlow();
    resetPollingStatus();
  }, [eventId, clearSelection, resetFlow, resetPollingStatus]);

  // On every successful poll, drop any selected seat that is no longer
  // available so the selection can never silently contain a booked/blocked
  // seat (and "selected" can never render over an unavailable style).
  useEffect(() => {
    if (!data) return;
    const availableIds = data.seats
      .filter((seat) => seat.status === SEAT_STATUS.AVAILABLE)
      .map((seat) => seat.id);
    const labelById = Object.fromEntries(
      data.seats.map((seat) => [seat.id, `${seat.row_label}${seat.seat_number}`]),
    );
    pruneUnavailable({ availableIds, labelById });
  }, [data, pruneUnavailable]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <SeatMapPanel
          data={data}
          loading={loading}
          error={error}
          onRetry={refetch}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={toggleSeat}
        />
      </div>
      <aside className="w-full shrink-0 lg:w-80">
        <BookingPanel eventId={eventId} onBooked={refetch} onConflict={refetch} />
      </aside>
    </div>
  );
}
