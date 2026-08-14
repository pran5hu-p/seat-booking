import { z } from "zod";

// One schema shared by the create-event form and the API service (which
// re-validates the full payload before sending). rows/seatsPerRow come from
// number inputs (strings), so they are coerced; coercion of "" yields 0, which
// then fails the positive() guard with a clear message.
export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
  eventDate: z.string().min(1, "Date and time is required"),
  rows: z.coerce
    .number({ invalid_type_error: "Rows must be a number" })
    .int("Rows must be a whole number")
    .positive("Rows must be at least 1"),
  seatsPerRow: z.coerce
    .number({ invalid_type_error: "Seats per row must be a number" })
    .int("Seats per row must be a whole number")
    .positive("Seats per row must be at least 1"),
});

export const createEventDefaultValues = {
  name: "",
  eventDate: "",
  rows: 5,
  seatsPerRow: 10,
};
