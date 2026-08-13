"use client";

// Default export: next/dynamic imports this file, which requires a default
// export. Renders nothing defensively if called without a booking.
export default function BookingConfirmation({ booking }) {
  if (!booking) return null;
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
        Booking confirmed
      </p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-500">Booking ID</dt>
          <dd className="font-medium">{booking.booking_group_id}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-500">Seats</dt>
          <dd className="font-medium">{booking.seat_labels.join(", ")}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-500">Booked at</dt>
          <dd className="font-medium">{new Date(booking.created_at).toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}
