import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function TrackerPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6">
      <section className="soft-panel rounded-lg p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          BetterMe
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
          Weekly tracker
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Your full weekly habit tracker is planned for the Phase 1 tracker task. This
          screen is available now so navigation never lands on a blank route.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-teal-100 bg-white/80 p-4">
            <h2 className="text-sm font-bold text-slate-950">Today</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Daily check-in controls will appear here.
            </p>
          </div>
          <div className="rounded-md border border-sky-100 bg-white/80 p-4">
            <h2 className="text-sm font-bold text-slate-950">This week</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Monday through Sunday progress will be shown here.
            </p>
          </div>
          <div className="rounded-md border border-rose-100 bg-white/80 p-4">
            <h2 className="text-sm font-bold text-slate-950">Reflection</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Notes and tomorrow focus will be connected here.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Open settings</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
