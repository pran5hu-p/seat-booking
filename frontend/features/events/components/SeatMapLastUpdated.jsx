"use client";

import { formatTime } from "@/lib/utils/format";

import { useSeatMapStore } from "../store/seatMapStore";

// Renders nothing until the first successful fetch has set a timestamp.
export function SeatMapLastUpdated() {
  const lastRefreshedAt = useSeatMapStore((s) => s.lastRefreshedAt);
  if (!lastRefreshedAt) return null;
  return <p className="text-xs text-zinc-500">Last updated {formatTime(lastRefreshedAt)}</p>;
}
