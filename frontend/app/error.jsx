"use client";

export default function Error({ error, reset }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {error?.message ?? "An unexpected error occurred."}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded border border-zinc-300 px-4 py-2 text-sm"
      >
        Try again
      </button>
    </main>
  );
}
