"use client";

import { useCallback } from "react";

import { SEAT_STATUS } from "@/lib/constants/seatStatus";

import { blockSeats, unblockSeats } from "../services/adminService";
import { useAdminBlockStore } from "../store/adminBlockStore";

// Owns the apply orchestration: partition the pending selection by each seat's
// CURRENT server status, fire the block/unblock calls, and write the outcome
// back to the store. Components stay thin and just render state.
export function useAdminBlockFlow(eventId, seats, { onApplied } = {}) {
  const markSubmitting = useAdminBlockStore((s) => s.markSubmitting);
  const setApplyError = useAdminBlockStore((s) => s.setApplyError);
  const clearSelection = useAdminBlockStore((s) => s.clearSelection);
  const pruneBooked = useAdminBlockStore((s) => s.pruneBooked);

  const apply = useCallback(async () => {
    const { selectedSeatIds } = useAdminBlockStore.getState();
    if (selectedSeatIds.length === 0) return;

    // Partition against the LATEST seats prop, not the state the grid last
    // rendered from, so a seat that flipped between render and click lands in
    // the correct bucket. A pending seat that is now booked is pruned (with a
    // notice) instead of being sent to the block endpoint.
    const statusById = new Map(seats.map((seat) => [seat.id, seat.status]));
    const labelById = Object.fromEntries(
      seats.map((seat) => [seat.id, `${seat.row_label}${seat.seat_number}`]),
    );

    const blockIds = [];
    const unblockIds = [];
    const newlyBookedIds = [];
    for (const seatId of selectedSeatIds) {
      const status = statusById.get(seatId);
      if (status === SEAT_STATUS.BLOCKED) unblockIds.push(seatId);
      else if (status === SEAT_STATUS.AVAILABLE) blockIds.push(seatId);
      else newlyBookedIds.push(seatId);
    }
    if (newlyBookedIds.length > 0) {
      pruneBooked({ bookedIds: new Set(newlyBookedIds), labelById });
    }

    markSubmitting();

    // Each call is all-or-nothing on the backend, so a failed call marks every
    // seat sent to it as failed. Empty lists skip the call entirely.
    const results = await Promise.all([
      blockIds.length > 0 ? blockSeats(eventId, blockIds) : { ok: true },
      unblockIds.length > 0 ? unblockSeats(eventId, unblockIds) : { ok: true },
    ]);

    const failedIds = [];
    const messages = [];
    if (!results[0].ok) {
      failedIds.push(...blockIds);
      messages.push(results[0].error.detail);
    }
    if (!results[1].ok) {
      failedIds.push(...unblockIds);
      messages.push(results[1].error.detail);
    }

    if (failedIds.length === 0) {
      clearSelection();
    } else {
      const labels = failedIds.map((id) => labelById[id] ?? id);
      setApplyError({ seatIds: failedIds, labels, message: messages.join(" · ") });
    }

    onApplied?.();
  }, [eventId, seats, markSubmitting, setApplyError, clearSelection, pruneBooked, onApplied]);

  return { apply };
}
