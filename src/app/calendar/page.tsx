import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6">
      <section className="soft-panel rounded-lg p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          BetterMe
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
          Calendar
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          The monthly completion calendar will be composed in the Phase 1 calendar task.
          For now, this route has a visible scaffold instead of an empty screen.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tracker">Open tracker</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
