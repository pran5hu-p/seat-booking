"use client";

import { memo, useMemo } from "react";

import { SEAT_STATUS } from "@/lib/constants/seatStatus";

import { seatStateClasses } from "./seatClasses";

// Stable module-level defaults reproduce the booking view's original behavior,
// so SeatMapPanel keeps working without passing anything. Module-level, not
// inline, so the predicate identity stays constant across renders and the
// memoized cells below never re-render for a new default function.
const defaultIsDisabled = (seat) => seat.status !== SEAT_STATUS.AVAILABLE;
const defaultIsActive = () => false;

// Memoized cell: every prop is a primitive (or a stable zustand action), so on
// each poll only cells whose status actually changed re-render. Passing the
// seat object itself would defeat memo because the poll returns fresh object
// identities every time. The isDisabled/isActive predicates are evaluated in
// SeatGrid, never here, so their results arrive as plain booleans and keep the
// memo contract intact even when a caller passes a fresh closure.
const SeatCell = memo(function SeatCell({ seatId, label, status, isSelected, isActive, isDisabled, onToggleSeat }) {
  return (
    <button
      type="button"
      aria-label={`Seat ${label}`}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={() => onToggleSeat(seatId)}
      className={seatStateClasses({ status, isSelected, isActive, isDisabled })}
    >
      {label}
    </button>
  );
});

function groupSeatsByRow(seats) {
  const rowOrder = [];
  const seatsByRow = new Map();
  for (const seat of seats) {
    if (!seatsByRow.has(seat.row_label)) {
      seatsByRow.set(seat.row_label, []);
      rowOrder.push(seat.row_label);
    }
    seatsByRow.get(seat.row_label).push(seat);
  }
  return rowOrder.map((rowLabel) => ({ rowLabel, seats: seatsByRow.get(rowLabel) }));
}

export function SeatGrid({
  seats,
  selectedSeatIds,
  onToggleSeat,
  isDisabled = defaultIsDisabled,
  isActive = defaultIsActive,
}) {
  const selectedSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const rows = useMemo(() => groupSeatsByRow(seats), [seats]);

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-2.5">
        {rows.map(({ rowLabel, seats: rowSeats }) => (
          <div key={rowLabel} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-medium text-zinc-500">
              {rowLabel}
            </span>
            <div className="flex gap-1.5 sm:gap-2">
              {rowSeats.map((seat) => (
                <SeatCell
                  key={seat.id}
                  seatId={seat.id}
                  label={`${seat.row_label}${seat.seat_number}`}
                  status={seat.status}
                  isSelected={selectedSet.has(seat.id)}
                  isActive={isActive(seat)}
                  isDisabled={isDisabled(seat)}
                  onToggleSeat={onToggleSeat}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
