import Link from "next/link";

export default function AdminEventsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create events and manage seat availability. The event list and create
          form load here in Phase 7.
        </p>
      </div>
      <Link href="/" className="text-sm underline">
        Back to events
      </Link>
    </main>
  );
}
