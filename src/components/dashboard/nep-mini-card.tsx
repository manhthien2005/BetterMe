"use client";

import Link from "next/link";

import type { CompanionPetView, PetSpecies, PetStage } from "@/components/dashboard/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * A face, not a portrait. `/nep` renders the real SVG `Pet` — interactive,
 * animated, the size of a hero. The backyard only needs enough of the pet to
 * recognise it at a glance, so an emoji that grows with the stage costs nothing
 * and stays honest about being a shortcut to the real thing.
 */
const PET_FACES: Record<PetSpecies, Record<PetStage, string>> = {
  dog: { baby: "🐣", kid: "🐶", junior: "🐶", teen: "🐕", adult: "🐕‍🦺" },
  cat: { baby: "🐣", kid: "🐱", junior: "🐱", teen: "🐈", adult: "🐈‍⬛" }
};

export type NepMiniCardProps = {
  /** The pet's current line, if it has one to say. */
  bubble: string | null;
  food: number;
  onFeed: () => void;
  onPet: () => void;
  pet: CompanionPetView | null;
};

/**
 * Nếp's corner of the day view — the backyard's one card (spec §4.4).
 *
 * Prop-driven on purpose: this is a second surface onto the same companion data
 * `/nep` already owns, so it takes the pet and the two handlers rather than
 * reaching into the provider. That keeps it testable without standing up the
 * whole app, and keeps the pet's state in exactly one place.
 *
 * Read-only plus the two actions that already exist (`onFeed`, `onPet`) — no
 * path here can lower growth or bond (invariant 2).
 */
export function NepMiniCard({ bubble, food, onFeed, onPet, pet }: NepMiniCardProps) {
  if (!pet) {
    return (
      <Card aria-labelledby="nep-mini-heading" className="grid gap-3" role="region">
        <h2 className="font-display text-lg font-bold text-ink" id="nep-mini-heading">
          Một quả trứng đang đợi
        </h2>
        <p className="text-sm font-semibold leading-6 text-ink-mid">
          Nếp đang đợi Sếp đặt tên. Ghé qua nhà là nhận nuôi được ngay.
        </p>
        <Link
          className="text-sm font-bold text-action underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
          href="/nep"
        >
          Ghé nhà Nếp ▸
        </Link>
      </Card>
    );
  }

  const outOfFood = food <= 0;

  return (
    <Card aria-labelledby="nep-mini-heading" className="grid gap-3" role="region">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-3xl">
          {PET_FACES[pet.species][pet.stage]}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-bold text-ink" id="nep-mini-heading">
            {pet.name}
          </h2>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-mid">
            Ngày chăm {pet.growthDays}
          </p>
        </div>
      </div>

      {bubble ? (
        <p className="rounded-card border border-line bg-surface-warm px-3 py-2 text-sm font-semibold leading-5 text-ink">
          {bubble}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-ink-mid">
          <span>Thân thiết</span>
          <span className="text-ink">{pet.bondTierLabel}</span>
        </div>
        {/* A bar, not the ProgressRing. AGENTS.md keeps one ring in the app for
            the day's completion; bond is a different quantity on a different
            axis, and stacking a second ring beside the first would read as two
            competing scores. */}
        <div
          aria-label={`Thân thiết với ${pet.name}: ${pet.bondTierLabel}, cấp ${pet.bondTier} trên 5`}
          aria-valuemax={5}
          aria-valuemin={0}
          aria-valuenow={pet.bondTier}
          className="h-2 overflow-hidden rounded-pill bg-surface-warm"
          role="progressbar"
        >
          <div
            className="h-full rounded-pill bg-action transition-all duration-500"
            style={{ width: `${Math.max(pet.bondProgress * 100, 4)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* The one primary in this region (spec §2.3). When the tray is empty the
            button simply dims — a disabled control says "not now" on its own,
            and a sentence explaining it would be the guilt the first invariant
            exists to prevent. */}
        <Button disabled={outOfFood} onClick={onFeed} size="sm" type="button">
          Cho ăn {pet.species === "dog" ? "🦴" : "🐟"} ×{food}
        </Button>
        <Button onClick={onPet} size="sm" type="button" variant="secondary">
          Vuốt ve
        </Button>
      </div>

      <Link
        className="text-sm font-bold text-action underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
        href="/nep"
      >
        Ghé nhà {pet.name} ▸
      </Link>
    </Card>
  );
}
