import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminEventView } from "@/features/admin/components/AdminEventView";
import { getEventDashboard } from "@/features/admin/services/adminService";
import { getEventDetail } from "@/features/events/services/eventService";

// Live dashboard data: never prerender at build time.
export const dynamic = "force-dynamic";

export default async function AdminEventDashboardPage({ params }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    notFound();
  }

  const [dashboardResult, eventResult] = await Promise.all([
    getEventDashboard(eventId),
    getEventDetail(eventId),
  ]);

  if (!dashboardResult.ok) {
    if (dashboardResult.error.status === 404) notFound();
    throw new Error(dashboardResult.error.detail);
  }
  if (!eventResult.ok) {
    if (eventResult.error.status === 404) notFound();
    throw new Error(eventResult.error.detail);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/admin" className="w-fit text-sm text-zinc-500 underline">
        Back to admin
      </Link>
      {/* key={eventId} remounts the view when navigating between events, so the
          dashboard never shows a previous event's seat map. */}
      <AdminEventView
        key={eventId}
        eventId={eventId}
        eventName={eventResult.data.name}
        eventDate={eventResult.data.event_date}
        dashboard={dashboardResult.data}
        seats={eventResult.data.seats}
      />
    </main>
  );
}
