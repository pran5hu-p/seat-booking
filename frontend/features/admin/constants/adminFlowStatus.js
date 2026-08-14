// Single source of truth for the seat block/unblock apply-flow status. Named
// constants only: components never compare against a raw string literal.
export const ADMIN_FLOW = Object.freeze({
  IDLE: "idle",
  SUBMITTING: "submitting",
  ERROR: "error",
});
