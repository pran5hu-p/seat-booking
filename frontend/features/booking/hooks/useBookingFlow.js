"use client";

import { useCallback } from "react";

import { BOOKING_FLOW } from "../constants/bookingFlowStatus";
import { createBooking } from "../services/bookingService";
import { useBookingStore } from "../store/bookingStore";

// Owns the submit orchestration: status transitions, store writes, and the
// success/conflict side effects. Components stay thin and just render state.
export function useBookingFlow(eventId, { onBooked, onConflict } = {}) {
  const flowStatus = useBookingStore((s) => s.flowStatus);
  const lastBooking = useBookingStore((s) => s.lastBooking);
  const conflictDetail = useBookingStore((s) => s.conflictDetail);
  const submitError = useBookingStore((s) => s.submitError);

  const setFlowStatus = useBookingStore((s) => s.setFlowStatus);
  const setLastBooking = useBookingStore((s) => s.setLastBooking);
  const setConflictDetail = useBookingStore((s) => s.setConflictDetail);
  const setSubmitError = useBookingStore((s) => s.setSubmitError);
  const clearSelection = useBookingStore((s) => s.clearSelection);

  const submit = useCallback(
    async (values) => {
      setSubmitError(null);
      setFlowStatus(BOOKING_FLOW.SUBMITTING);
      // Read the freshest selection at submit time so a poll that pruned a
      // seat between renders can never be overridden by a stale closure.
      const { selectedSeatIds } = useBookingStore.getState();
      const result = await createBooking(eventId, { seatIds: selectedSeatIds, ...values });
      if (result.ok) {
        setLastBooking(result.data);
        clearSelection();
        setFlowStatus(BOOKING_FLOW.SUCCESS);
        onBooked?.();
      } else if (result.error.status === 409) {
        setConflictDetail(result.error.detail);
        clearSelection();
        setFlowStatus(BOOKING_FLOW.CONFLICT_ERROR);
        onConflict?.();
      } else {
        setFlowStatus(BOOKING_FLOW.IDLE);
        setSubmitError(result.error.detail);
      }
    },
    [eventId, setFlowStatus, setSubmitError, setLastBooking, clearSelection, setConflictDetail, onBooked, onConflict],
  );

  return { flowStatus, lastBooking, conflictDetail, submitError, submit };
}
