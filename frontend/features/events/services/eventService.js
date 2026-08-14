import { apiGet } from "@/lib/api/client";
import { API_PATHS } from "@/lib/constants/apiPaths";

// No inline fetches in components: all event reads go through this service.
export async function listEvents() {
  return apiGet(API_PATHS.events);
}

export async function getEventDetail(eventId) {
  return apiGet(API_PATHS.eventDetail(eventId));
}
