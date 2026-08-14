import Link from "next/link";

import { CreateEventForm } from "@/features/admin/components/CreateEventForm";
import { listAdminEvents } from "@/features/admin/services/adminService";
import { formatEventDate } from "@/lib/utils/format";

// Live data (counts change with every booking/block action): never prerender
// against a stale build snapshot or a DB that may be down during next build.
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const result = await listAdminEvents();
  if (!result.ok) {
    throw new Error(result.error.detail);
  }
  const events = result.data;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create events and manage seat availability.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Events</h2>
        {events.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
            No events yet. Create your first one below.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {events.map((event) => (
              <li key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-zinc-500">{formatEventDate(event.event_date)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                  <span>{event.total_seats} seats</span>
                  <span className="text-emerald-600">{event.available_seats} available</span>
                  <span>{event.booked_seats} booked</span>
                  <span>{event.blocked_seats} blocked</span>
                </div>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="w-fit shrink-0 rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Dashboard
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateEventForm />

      <Link href="/" className="text-sm underline">
        Back to events
      </Link>
    </main>
  );
}
