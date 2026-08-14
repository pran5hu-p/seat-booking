"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createEventDefaultValues, createEventSchema } from "../schemas/createEventSchema";
import { useCreateEvent } from "../hooks/useCreateEvent";

// React Hook Form + Zod, per AGENTS.md. On success the router refreshes the
// server-rendered event list (so the new event appears) and the form resets.
export function CreateEventForm() {
  const router = useRouter();
  const { submit, submitting, submitError } = useCreateEvent({
    onCreated: () => router.refresh(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: createEventDefaultValues,
  });

  const onSubmit = async (values) => {
    const created = await submit(values);
    if (created) reset();
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold">Create event</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="eventDate" className="mb-1 block text-sm font-medium">
            Date and time
          </label>
          <input
            id="eventDate"
            type="datetime-local"
            {...register("eventDate")}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {errors.eventDate && (
            <p className="mt-1 text-xs text-red-600">{errors.eventDate.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rows" className="mb-1 block text-sm font-medium">
              Rows
            </label>
            <input
              id="rows"
              type="number"
              min="1"
              {...register("rows")}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {errors.rows && <p className="mt-1 text-xs text-red-600">{errors.rows.message}</p>}
          </div>
          <div>
            <label htmlFor="seatsPerRow" className="mb-1 block text-sm font-medium">
              Seats per row
            </label>
            <input
              id="seatsPerRow"
              type="number"
              min="1"
              {...register("seatsPerRow")}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {errors.seatsPerRow && (
              <p className="mt-1 text-xs text-red-600">{errors.seatsPerRow.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create event"}
        </button>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </form>
    </section>
  );
}
