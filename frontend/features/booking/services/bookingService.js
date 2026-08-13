import { apiPost } from "@/lib/api/client";
import { API_PATHS } from "@/lib/constants/apiPaths";

import { bookingFormSchema } from "../schemas/bookingFormSchema";

// All booking writes go through this service. It re-validates the payload
// (defense in depth on top of the form's own validation) and maps the
// camelCase values to the API's snake_case body. seat_ids min_length=1 on the
// backend is the final guard against booking zero seats.
export async function createBooking(eventId, values) {
  const parsed = bookingFormSchema.safeParse(values);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(", ");
    return { ok: false, error: { status: 422, detail } };
  }
  return apiPost(API_PATHS.bookEvent(eventId), {
    seat_ids: parsed.data.seatIds,
    booker_name: parsed.data.bookerName,
    booker_email: parsed.data.bookerEmail,
  });
}
