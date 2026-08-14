// Pure presentation for the four dashboard counts. Data comes from the server
// component's dashboard fetch; nothing here fetches.
export function AdminCountsGrid({ dashboard }) {
  const items = [
    { label: "Total seats", value: dashboard.total_seats, accent: "text-zinc-900 dark:text-zinc-100" },
    { label: "Available", value: dashboard.available_seats, accent: "text-emerald-600" },
    { label: "Booked", value: dashboard.booked_seats, accent: "text-zinc-500" },
    { label: "Blocked", value: dashboard.blocked_seats, accent: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, accent }) => (
        <div
          key={label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm text-zinc-500">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
