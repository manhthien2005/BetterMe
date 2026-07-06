import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6">
      <section className="soft-panel rounded-lg p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
          BetterMe
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
          Settings
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Theme, timezone, local data, and tracker preferences will be wired in the Phase
          1 settings task. This page now gives the route a clear visible state.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-teal-100 bg-white/80 p-4">
            <h2 className="text-sm font-bold text-slate-950">Theme</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cute Cat, Study Corner, Modern Focus, and Minimal Calm stay planned.
            </p>
          </div>
          <div className="rounded-md border border-sky-100 bg-white/80 p-4">
            <h2 className="text-sm font-bold text-slate-950">Local data</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Storage status and reset controls will live here.
            </p>
          </div>
        </div>
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
