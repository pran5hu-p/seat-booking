import Link from "next/link";

import { listEvents } from "@/features/events/services/eventService";
import { formatEventDate } from "@/lib/utils/format";

// Live data (new events appear the moment they're created): never prerender
// against a stale build snapshot.
export const dynamic = "force-dynamic";

export default async function EventListPage() {
  const result = await listEvents();
  if (!result.ok) {
    throw new Error(result.error.detail);
  }
  const events = result.data;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Browse upcoming events and book seats.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
          No events yet. Check back soon.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{event.name}</p>
                <p className="text-sm text-zinc-500">{formatEventDate(event.event_date)}</p>
              </div>
              <Link
                href={`/events/${event.id}`}
                className="w-fit shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                View seats &amp; book
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin" className="text-sm underline">
        Admin
      </Link>
    </main>
  );
}
