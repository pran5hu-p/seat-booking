import { z } from "zod";

// One schema shared by the form (via .omit, since seatIds come from the store)
// and the API service (which re-validates the full payload before sending).
export const bookingFormSchema = z.object({
  seatIds: z.array(z.number().int().positive()).min(1, "Select at least one seat"),
  bookerName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
  bookerEmail: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

export const bookingFormDefaultValues = {
  bookerName: "",
  bookerEmail: "",
};
