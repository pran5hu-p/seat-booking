import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingPageView } from "@/features/booking/components/BookingPageView";

export default async function EventBookingPage({ params }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    notFound();
  }

  // key={eventId} remounts the view when navigating between events, so the
  // booking page never shows a previous event's selection or seat map.
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/" className="w-fit text-sm text-zinc-500 underline">
        Back to events
      </Link>
      <BookingPageView key={eventId} eventId={eventId} />
    </main>
  );
}
