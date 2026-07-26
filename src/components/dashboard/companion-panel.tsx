"use client";

import { useState } from "react";

import type {
  CompanionPetView,
  DashboardViewModel,
  PetSpecies
} from "@/components/dashboard/dashboard-data";
import { GiftBox, Pet, PetAdoption } from "@/components/dashboard/pet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CompanionHandlers = {
  bubble: string | null;
  eating: boolean;
  onAdopt: (species: PetSpecies, name: string) => void;
  onFeed: () => void;
  onOpenGift: () => void;
  onPet: () => void;
  onSwitch: (species: PetSpecies) => void;
};

/**
 * The companion's home inside the hero: adoption eggs on first run, then the
 * pet with its speech bubble, bond meter, food tray, and species switcher.
 * Extracted from the dashboard shell so the pet is its own maintainable unit
 * while still living in the hero — the emotional anchor keeps prime placement.
 */
export function CompanionPanel({
  bubble,
  celebrate,
  eating,
  onAdopt,
  onFeed,
  onOpenGift,
  onPet,
  onSwitch,
  viewModel
}: CompanionHandlers & {
  celebrate: boolean;
  viewModel: DashboardViewModel;
}) {
  const companion = viewModel.companion;
  const pet = companion.activePet;
  const [adoptionTarget, setAdoptionTarget] = useState<PetSpecies | null>(null);

  if (!pet) {
    return <PetAdoption onAdopt={onAdopt} />;
  }

  if (adoptionTarget) {
    return (
      <PetAdoption
        initialSpecies={adoptionTarget}
        onAdopt={(species, name) => {
          onAdopt(species, name);
          setAdoptionTarget(null);
        }}
        onCancel={() => setAdoptionTarget(null)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {bubble ? <SpeechBubble key={bubble} text={bubble} /> : null}

      <div className="relative">
        <Pet
          bondTier={pet.bondTier}
          celebrate={celebrate}
          completedCount={viewModel.today.completedHabits}
          eating={eating}
          name={pet.name}
          onPet={onPet}
          species={pet.species}
          stage={pet.stage}
          totalCount={viewModel.today.totalHabits}
        />
        {companion.pendingGift ? (
          <GiftBox label={`Mở món quà ${pet.name} để dành`} onOpen={onOpenGift} />
        ) : null}
      </div>

      <div className="flex w-full min-w-[260px] max-w-[300px] flex-col gap-2">
        <BondMeter pet={pet} />
        <div className="flex items-center justify-between gap-2">
          <FoodTray
            disabled={companion.food <= 0 || eating}
            food={companion.food}
            onFeed={onFeed}
            species={pet.species}
          />
          <PetSwitcher
            active={pet.species}
            adopted={companion.adoptedSpecies}
            onAdoptRequest={setAdoptionTarget}
            onSwitch={onSwitch}
          />
        </div>
        <p className="text-center text-xs font-bold text-mauve">
          Ngày chăm: {pet.growthDays}
          {pet.daysToNextStage !== null
            ? ` · còn ${pet.daysToNextStage} ngày nữa lớn 🌱`
            : " · đã trưởng thành 🌸"}
        </p>
      </div>
    </div>
  );
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="bubble-in relative max-w-[260px] rounded-2xl border border-wafer bg-mochi px-4 py-2.5 text-center text-sm font-semibold leading-5 text-plum shadow-mochi">
      {text}
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-wafer bg-mochi"
      />
    </div>
  );
}

function BondMeter({ pet }: { pet: CompanionPetView }) {
  return (
    <div className="rounded-2xl border border-wafer bg-white/75 px-3 py-2">
      <div className="flex items-center justify-between text-xs font-bold text-mauve">
        <span aria-label={`Thân thiết cấp ${pet.bondTier} trên 5`} className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((tier) => (
            <span
              aria-hidden="true"
              className={cn("text-sm", tier > pet.bondTier && "opacity-25 grayscale")}
              key={tier}
            >
              💗
            </span>
          ))}
        </span>
        <span className="text-plum">{pet.bondTierLabel}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-wafer">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sakura to-sakura-deep transition-all duration-500"
          style={{ width: `${Math.max(pet.bondProgress * 100, 4)}%` }}
        />
      </div>
    </div>
  );
}

function FoodTray({
  disabled,
  food,
  onFeed,
  species
}: {
  disabled: boolean;
  food: number;
  onFeed: () => void;
  species: PetSpecies;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-wafer bg-white/75 py-1.5 pl-3 pr-1.5">
      <span aria-label={`${food} món ăn trong tủ`} className="text-sm font-bold text-plum">
        {species === "dog" ? "🦴" : "🐟"} ×{food}
      </span>
      <Button disabled={disabled} onClick={onFeed} size="sm" type="button">
        Cho ăn
      </Button>
    </div>
  );
}

const SWITCHER_PETS: Array<{ species: PetSpecies; emoji: string; label: string }> = [
  { species: "dog", emoji: "🐶", label: "cún" },
  { species: "cat", emoji: "🐱", label: "mèo" }
];

function PetSwitcher({
  active,
  adopted,
  onAdoptRequest,
  onSwitch
}: {
  active: PetSpecies;
  adopted: PetSpecies[];
  onAdoptRequest: (species: PetSpecies) => void;
  onSwitch: (species: PetSpecies) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-wafer bg-white/75 p-1.5">
      {SWITCHER_PETS.map((entry) => {
        const isAdopted = adopted.includes(entry.species);
        const isActive = entry.species === active;

        return (
          <button
            aria-label={
              isAdopted
                ? isActive
                  ? `Bé ${entry.label} đang chơi cùng bạn`
                  : `Gọi bé ${entry.label} ra chơi`
                : `Nhận nuôi bé ${entry.label}`
            }
            aria-pressed={isActive}
            className={cn(
              "squishy flex h-9 w-9 items-center justify-center rounded-full text-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep",
              isActive ? "bg-matcha/20 ring-1 ring-matcha/50" : "hover:bg-rice",
              !isAdopted && "opacity-70"
            )}
            key={entry.species}
            onClick={() =>
              isAdopted ? onSwitch(entry.species) : onAdoptRequest(entry.species)
            }
            title={
              isAdopted
                ? isActive
                  ? "Đang ở đây với bạn"
                  : "Đang ở nhà nghỉ ngơi — bấm để gọi ra"
                : "Còn một quả trứng đang đợi bạn"
            }
            type="button"
          >
            {isAdopted ? entry.emoji : "🥚"}
          </button>
        );
      })}
    </div>
  );
}
