import { create } from "zustand";

import { ADMIN_FLOW } from "../constants/adminFlowStatus";

// Global admin seat-blocking state per AGENTS.md: the in-progress selection
// and the apply-flow outcome are cross-cutting UI state, never local component
// state. Ephemeral, no persistence middleware.
const initialState = {
  selectedSeatIds: [],
  droppedSeatLabels: [],
  flowStatus: ADMIN_FLOW.IDLE,
  failedSeatLabels: [],
  applyError: null,
};

export const useAdminBlockStore = create((set, get) => ({
  ...initialState,

  toggleSeat: (seatId) => {
    const { selectedSeatIds } = get();
    const next = selectedSeatIds.includes(seatId)
      ? selectedSeatIds.filter((id) => id !== seatId)
      : [...selectedSeatIds, seatId];
    set({
      selectedSeatIds: next,
      droppedSeatLabels: [],
      flowStatus: ADMIN_FLOW.IDLE,
      failedSeatLabels: [],
      applyError: null,
    });
  },

  clearSelection: () =>
    set({
      selectedSeatIds: [],
      droppedSeatLabels: [],
      flowStatus: ADMIN_FLOW.IDLE,
      failedSeatLabels: [],
      applyError: null,
    }),

  // Background-prune: a pending seat that is now booked can't stay selected -
  // it is disabled on the grid (so clicking can never deselect it) and must
  // never be sent to the block endpoint. Surfaced as a notice, never silent.
  pruneBooked: ({ bookedIds, labelById }) => {
    const { selectedSeatIds } = get();
    const stillValid = selectedSeatIds.filter((id) => !bookedIds.has(id));
    if (stillValid.length === selectedSeatIds.length) return;
    const dropped = selectedSeatIds.filter((id) => bookedIds.has(id));
    set({
      selectedSeatIds: stillValid,
      droppedSeatLabels: dropped.map((id) => labelById[id] ?? id),
    });
  },

  markSubmitting: () =>
    set({ flowStatus: ADMIN_FLOW.SUBMITTING, failedSeatLabels: [], applyError: null }),

  // Keep the failed seats selected so the admin can retry without re-picking
  // them; only the applied seats are removed from the selection.
  setApplyError: ({ seatIds, labels, message }) =>
    set({
      selectedSeatIds: seatIds,
      flowStatus: ADMIN_FLOW.ERROR,
      failedSeatLabels: labels,
      applyError: message,
    }),

  reset: () => set({ ...initialState }),
}));
