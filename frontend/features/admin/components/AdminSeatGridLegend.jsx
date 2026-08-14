"use client";

import { SEAT_STATUS } from "@/lib/constants/seatStatus";
import { seatColorClasses } from "@/ui/seat-grid/seatClasses";

// Admin-mode legend. Blocked seats render with the isActive "toggled on" style
// (emerald hatch) here, not the passive gray hatch the booking legend shows, so
// the swatches must be built for the admin grid's states rather than reusing
// the booking legend.
const LEGEND_ITEMS = [
  { key: "available", status: SEAT_STATUS.AVAILABLE, isSelected: false, isActive: false, label: "Available" },
  { key: "selected", status: SEAT_STATUS.AVAILABLE, isSelected: true, isActive: false, label: "Selected" },
  { key: "blocked", status: SEAT_STATUS.BLOCKED, isSelected: false, isActive: true, label: "Blocked (click to unblock)" },
  { key: "booked", status: SEAT_STATUS.BOOKED, isSelected: false, isActive: false, label: "Booked" },
];

export function AdminSeatGridLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {LEGEND_ITEMS.map(({ key, status, isSelected, isActive, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-sm border ${seatColorClasses({ status, isSelected, isActive })}`}
          />
          <span className="text-xs text-zinc-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
