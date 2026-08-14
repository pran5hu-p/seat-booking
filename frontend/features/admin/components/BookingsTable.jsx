import { formatEventDate } from "@/lib/utils/format";

// Pure presentation of the bookings list from the dashboard fetch. A seat can
// only ever be booked once (UNIQUE seat_id), so seat_label is a safe key.
export function BookingsTable({ bookings }) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
        No bookings yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-2 font-medium text-zinc-500">Seat</th>
            <th className="px-4 py-2 font-medium text-zinc-500">Name</th>
            <th className="px-4 py-2 font-medium text-zinc-500">Email</th>
            <th className="px-4 py-2 font-medium text-zinc-500">Booked at</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {bookings.map((row) => (
            <tr key={row.seat_label}>
              <td className="px-4 py-2 font-medium">{row.seat_label}</td>
              <td className="px-4 py-2">{row.booker_name}</td>
              <td className="px-4 py-2">{row.booker_email}</td>
              <td className="px-4 py-2 text-zinc-500">{formatEventDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
