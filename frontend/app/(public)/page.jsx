import Link from "next/link";

export default function EventListPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Browse upcoming events and book seats. The event list loads here in
          Phase 6.
        </p>
      </div>
      <Link href="/admin" className="text-sm underline">
        Admin
      </Link>
    </main>
  );
}
