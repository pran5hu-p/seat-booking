import { create } from "zustand";

// Global seat-map polling status (last-refreshed, stale/fresh), per AGENTS.md:
// this is cross-cutting UI state, not local component state. lastRefreshedAt is
// a Date because it renders directly ("Last updated 12:00:01 PM"); null until
// the first successful fetch.
const initialPollingState = {
  lastRefreshedAt: null,
  isStale: false,
  isRefreshing: false,
};

export const useSeatMapStore = create((set) => ({
  ...initialPollingState,

  markRefreshing: () => set({ isRefreshing: true }),

  markFresh: () =>
    set({ lastRefreshedAt: new Date(), isStale: false, isRefreshing: false }),

  markStale: () => set({ isStale: true, isRefreshing: false }),

  resetPollingStatus: () => set({ ...initialPollingState }),
}));
