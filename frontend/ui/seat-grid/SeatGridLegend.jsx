"use client";

import { SEAT_STATUS } from "@/lib/constants/seatStatus";

import { seatColorClasses } from "./seatClasses";

const LEGEND_ITEMS = [
  { key: "available", status: SEAT_STATUS.AVAILABLE, isSelected: false, label: "Available" },
  { key: "selected", status: SEAT_STATUS.AVAILABLE, isSelected: true, label: "Selected" },
  { key: "booked", status: SEAT_STATUS.BOOKED, isSelected: false, label: "Booked" },
  { key: "blocked", status: SEAT_STATUS.BLOCKED, isSelected: false, label: "Blocked" },
];

export function SeatGridLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {LEGEND_ITEMS.map(({ key, status, isSelected, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-sm border ${seatColorClasses({ status, isSelected })}`}
          />
          <span className="text-xs text-zinc-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
