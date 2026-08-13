"use client";

import dynamic from "next/dynamic";

import { BOOKING_FLOW } from "../constants/bookingFlowStatus";
import { useBookingFlow } from "../hooks/useBookingFlow";
import { useBookingStore } from "../store/bookingStore";
import { BookingConflict } from "./BookingConflict";
import { BookingForm } from "./BookingForm";
import { BookingSelectionNotice } from "./BookingSelectionNotice";
import { BookingSummary } from "./BookingSummary";

// Lazy-loaded: only needed after a successful booking, never on first paint.
const BookingConfirmation = dynamic(() => import("./BookingConfirmation"), {
  loading: () => (
    <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
      Loading confirmation…
    </p>
  ),
});

export function BookingPanel({ eventId, onBooked, onConflict }) {
  const { flowStatus, lastBooking, conflictDetail, submitError, submit } = useBookingFlow(
    eventId,
    { onBooked, onConflict },
  );
  const droppedSeatLabels = useBookingStore((s) => s.droppedSeatLabels);

  if (flowStatus === BOOKING_FLOW.SUCCESS) {
    return <BookingConfirmation booking={lastBooking} />;
  }

  if (flowStatus === BOOKING_FLOW.CONFLICT_ERROR) {
    return <BookingConflict detail={conflictDetail} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <BookingSelectionNotice labels={droppedSeatLabels} />
      <BookingSummary />
      <BookingForm
        onSubmit={submit}
        submitting={flowStatus === BOOKING_FLOW.SUBMITTING}
        submitError={submitError}
      />
    </div>
  );
}
