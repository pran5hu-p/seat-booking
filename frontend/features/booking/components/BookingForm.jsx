"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useBookingStore } from "../store/bookingStore";
import { bookingFormDefaultValues, bookingFormSchema } from "../schemas/bookingFormSchema";
import { BookingSubmitError } from "./BookingSubmitError";

// seatIds are chosen on the map, not in the form, so the form validates only
// the two fields it owns; the full schema still guards the service call.
const formSchema = bookingFormSchema.omit({ seatIds: true });

export function BookingForm({ onSubmit, submitting, submitError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: bookingFormDefaultValues,
  });
  const hasSelection = useBookingStore((s) => s.selectedSeatIds.length > 0);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <div>
        <label htmlFor="bookerName" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="bookerName"
          type="text"
          autoComplete="name"
          {...register("bookerName")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.bookerName && (
          <p className="mt-1 text-xs text-red-600">{errors.bookerName.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="bookerEmail" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="bookerEmail"
          type="email"
          autoComplete="email"
          {...register("bookerEmail")}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.bookerEmail && (
          <p className="mt-1 text-xs text-red-600">{errors.bookerEmail.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={!hasSelection || submitting}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Book selected seats"}
      </button>
      {submitError && (
        <BookingSubmitError message={submitError} onRetry={() => handleSubmit(onSubmit)()} />
      )}
    </form>
  );
}
