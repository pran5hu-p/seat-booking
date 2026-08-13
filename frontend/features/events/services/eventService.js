import { apiGet } from "@/lib/api/client";
import { API_PATHS } from "@/lib/constants/apiPaths";

// No inline fetches in components: all seat-map reads go through this service.
export async function getEventDetail(eventId) {
  return apiGet(API_PATHS.eventDetail(eventId));
}
