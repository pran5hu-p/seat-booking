import { apiGet, apiPost } from "@/lib/api/client";
import { API_PATHS } from "@/lib/constants/apiPaths";

import { createEventSchema } from "../schemas/createEventSchema";

// All admin reads/writes go through this service; no component or page does an
// inline fetch. The create-event payload is re-validated (defense in depth on
// top of the form) and mapped from camelCase form values to the API's
// snake_case body.
export async function listAdminEvents() {
  return apiGet(API_PATHS.adminEvents);
}

export async function createEvent(values) {
  const parsed = createEventSchema.safeParse(values);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(", ");
    return { ok: false, error: { status: 422, detail } };
  }
  return apiPost(API_PATHS.adminEvents, {
    name: parsed.data.name,
    event_date: new Date(parsed.data.eventDate).toISOString(),
    rows: parsed.data.rows,
    seats_per_row: parsed.data.seatsPerRow,
  });
}

export async function getEventDashboard(eventId) {
  return apiGet(API_PATHS.adminEventDashboard(eventId));
}

export async function blockSeats(eventId, seatIds) {
  return apiPost(API_PATHS.adminBlockSeats(eventId), { seat_ids: seatIds });
}

export async function unblockSeats(eventId, seatIds) {
  return apiPost(API_PATHS.adminUnblockSeats(eventId), { seat_ids: seatIds });
}
