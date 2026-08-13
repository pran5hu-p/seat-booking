import { create } from "zustand";

import { BOOKING_FLOW } from "../constants/bookingFlowStatus";

// In-memory booking flow state only: no sessionStorage/localStorage, no
// persist middleware. State is intentionally ephemeral and resets on reload.
const initialState = {
  selectedSeatIds: [],
  droppedSeatLabels: [],
  flowStatus: BOOKING_FLOW.IDLE,
  lastBooking: null,
  conflictDetail: null,
  submitError: null,
};

export const useBookingStore = create((set, get) => ({
  ...initialState,

  toggleSeat: (seatId) => {
    const { selectedSeatIds } = get();
    const next = selectedSeatIds.includes(seatId)
      ? selectedSeatIds.filter((id) => id !== seatId)
      : [...selectedSeatIds, seatId];
    set({ selectedSeatIds: next, droppedSeatLabels: [] });
  },

  clearSelection: () => set({ selectedSeatIds: [], droppedSeatLabels: [] }),

  // Background-poll pruning: a selected seat that is no longer available must
  // be dropped from the selection immediately, not left looking selected. The
  // removed labels are surfaced so the user sees what changed instead of a
  // silent mutation of their selection.
  pruneUnavailable: ({ availableIds, labelById }) => {
    const { selectedSeatIds } = get();
    const availableSet = new Set(availableIds);
    const stillAvailable = selectedSeatIds.filter((id) => availableSet.has(id));
    if (stillAvailable.length === selectedSeatIds.length) return;
    const dropped = selectedSeatIds.filter((id) => !availableSet.has(id));
    set({
      selectedSeatIds: stillAvailable,
      droppedSeatLabels: dropped.map((id) => labelById[id] ?? id),
    });
  },

  setFlowStatus: (flowStatus) => set({ flowStatus }),
  setLastBooking: (lastBooking) => set({ lastBooking }),
  setConflictDetail: (conflictDetail) => set({ conflictDetail }),
  setSubmitError: (submitError) => set({ submitError }),

  resetFlow: () =>
    set({
      flowStatus: BOOKING_FLOW.IDLE,
      lastBooking: null,
      conflictDetail: null,
      submitError: null,
    }),
}));
