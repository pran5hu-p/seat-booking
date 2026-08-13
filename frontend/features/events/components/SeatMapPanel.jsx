"use client";

import { formatEventDate } from "@/lib/utils/format";
import { SeatGrid } from "@/ui/seat-grid/SeatGrid";
import { SeatGridLegend } from "@/ui/seat-grid/SeatGridLegend";

import { SeatMapError } from "./SeatMapError";
import { SeatMapLastUpdated } from "./SeatMapLastUpdated";
import { SeatMapSkeleton } from "./SeatMapSkeleton";
import { SeatMapStaleBanner } from "./SeatMapStaleBanner";

// Pure presentation for the events side of the booking page. All fetching and
// store wiring lives in BookingPageView; this component only renders.
export function SeatMapPanel({ data, loading, error, onRetry, selectedSeatIds, onToggleSeat }) {
  return (
    <section className="flex flex-col gap-4">
      {data && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{formatEventDate(data.event_date)}</p>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SeatGridLegend />
        <SeatMapLastUpdated />
      </div>
      <SeatMapStaleBanner onRetry={onRetry} />
      {loading ? (
        <SeatMapSkeleton />
      ) : error ? (
        <SeatMapError message={error.detail} onRetry={onRetry} />
      ) : data ? (
        <SeatGrid seats={data.seats} selectedSeatIds={selectedSeatIds} onToggleSeat={onToggleSeat} />
      ) : null}
    </section>
  );
}
