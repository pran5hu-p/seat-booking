export default async function AdminEventDashboardPage({ params }) {
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Event {id} - Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Dashboard and seat blocking load here in Phase 7.
        </p>
      </div>
    </main>
  );
}
