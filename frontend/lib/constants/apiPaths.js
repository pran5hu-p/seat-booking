// Single source of truth for API paths. No component or service should ever
// inline a backend path string.
export const API_PATHS = Object.freeze({
  events: "/events",
  eventDetail: (eventId) => `/events/${eventId}`,
  bookEvent: (eventId) => `/events/${eventId}/book`,
});
