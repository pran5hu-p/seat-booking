export default async function EventBookingPage({ params }) {
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Event {id}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Seat map and booking flow load here in Phase 6.
        </p>
      </div>
    </main>
  );
}
