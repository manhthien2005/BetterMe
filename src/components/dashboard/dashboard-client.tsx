"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Check,
  CheckCircle2,
  CirclePlus,
  Flower2,
  Pencil,
  Sprout,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import {
  addHabitToState,
  adoptPet,
  buildDashboardViewModel,
  checkComebackGift,
  createInitialDashboardState,
  feedActivePet,
  getBondTier,
  getDashboardToday,
  getPetStage,
  grantAllDoneBonus,
  grantFoodForHabitCompletion,
  migrateDashboardState,
  openGift,
  petActivePet,
  recordGrowthDay,
  removeHabitFromState,
  switchActivePet,
  toggleHabitForDate,
  type CompanionPetView,
  type DashboardCalendarDay,
  type DashboardHabitView,
  type DashboardState,
  type DashboardStatus,
  type DashboardViewModel,
  type PetSpecies
} from "@/components/dashboard/dashboard-data";
import { GiftBox, Pet, PetAdoption } from "@/components/dashboard/pet";
import { getPetLine, type PetEvent } from "@/components/dashboard/pet-voice";
import { Button } from "@/components/ui/button";
import { cn, formatPercent } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "betterme.dashboard.v2";
const LEGACY_STORAGE_KEY = "betterme.dashboard.v1";
const SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ";
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0";

const HABIT_CATEGORIES = ["Discipline", "Learning", "Work", "Health", "Reflection"];

const DASHBOARD_WEATHER = {
  location: "Bangkok",
  temperature: "31°C",
  condition: "Clear evening",
  feelsLike: "34°C",
  humidity: "68%",
  wind: "9 km/h",
  rainChance: "12%",
  uvIndex: "Low after 5 PM",
  planningNote: "Good window for a light walk after focus work.",
  emoji: "☀️",
  emojiLabel: "Clear weather"
} as const;

export function DashboardClient({ userEmail }: { userEmail: string }) {
  const today = useMemo(() => getDashboardToday(), []);
  const [state, setState] = useState<DashboardState>(() =>
    createInitialDashboardState(today)
  );
  const [hydrated, setHydrated] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [eating, setEating] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const viewModel = useMemo(() => buildDashboardViewModel(state, today), [state, today]);
  const activePet = viewModel.companion.activePet;

  useEffect(() => {
    const saved =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    let loaded: DashboardState | null = null;

    if (saved) {
      try {
        loaded = migrateDashboardState(JSON.parse(saved));
      } catch {
        loaded = null;
      }
    }

    if (loaded) {
      const welcomed = checkComebackGift(loaded, today);

      setState(welcomed);

      const species = welcomed.companion.activeSpecies;
      const pet = species ? welcomed.companion.pets[species] : undefined;

      if (species && pet) {
        const hour = new Date().getHours();
        const event: PetEvent = hour < 12 ? "morning" : hour >= 21 ? "night" : "idle";

        setBubble(getPetLine(species, getBondTier(pet.bond), event));
      }
    }

    setHydrated(true);
  }, [today]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  /** Applies pet reactions to a state transition and picks the matching line. */
  function speakAfter(next: DashboardState, before: DashboardState, event: PetEvent) {
    const species = next.companion.activeSpecies;

    if (!species) return;

    const pet = next.companion.pets[species];
    const previous = before.companion.pets[species];

    if (!pet) return;

    const evolved =
      previous && getPetStage(previous.growthDays) !== getPetStage(pet.growthDays);

    setBubble(getPetLine(species, getBondTier(pet.bond), evolved ? "evolve" : event));
  }

  function toggleHabit(habitId: string) {
    const habit = viewModel.habits.find((item) => item.id === habitId);
    const turningOn = habit ? !habit.completed : false;
    const completesTheDay =
      turningOn &&
      viewModel.today.completedHabits === viewModel.today.totalHabits - 1;

    if (completesTheDay) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1300);
    }

    let next = toggleHabitForDate(state, today, habitId);

    if (turningOn && state.companion.activeSpecies) {
      next = grantFoodForHabitCompletion(
        next,
        today,
        viewModel.today.completedHabits + 1,
        viewModel.today.totalHabits
      );
      next = recordGrowthDay(next, today);

      if (completesTheDay) next = grantAllDoneBonus(next, today);

      speakAfter(next, state, completesTheDay ? "allDone" : "habitDone");
    }

    setState(next);
  }

  function feedPet() {
    if (state.companion.food <= 0 || eating) return;

    const next = feedActivePet(state, today);

    if (next === state) return;

    setEating(true);
    window.setTimeout(() => setEating(false), 1300);
    speakAfter(next, state, "feeding");
    setState(next);
  }

  function petThePet() {
    const next = petActivePet(state, today);

    speakAfter(next === state ? state : next, state, "petting");

    if (next !== state) setState(next);
  }

  function handleAdopt(species: PetSpecies, name: string) {
    const next = adoptPet(state, species, name, today);
    const adoptedName = next.companion.pets[species]?.name ?? name;

    setState(next);
    setBubble(getPetLine(species, 1, "morning"));
    toast.success(`${adoptedName} đã về nhà 💕`, {
      description:
        species === "dog"
          ? "Hoàn thành habit để kiếm bánh thưởng cho bé nhé."
          : "Hoàn thành habit để kiếm cá cho hoàng thượng nhé."
    });
  }

  function handleSwitchPet(species: PetSpecies) {
    const next = switchActivePet(state, species);

    if (next === state) return;

    const pet = next.companion.pets[species];

    setState(next);

    if (pet) setBubble(getPetLine(species, getBondTier(pet.bond), "idle"));
  }

  function handleOpenGift() {
    const next = openGift(state);

    if (next === state) return;

    speakAfter(next, state, "comeback");
    setState(next);
    toast.success("Quà để dành! +3 món ăn 🎁", {
      description: "Đi vắng mấy hôm cũng không sao — bé chỉ mong bạn về thôi."
    });
  }

  function addHabit(name: string, category: string) {
    setState((current) => addHabitToState(current, { name, category }));
    toast.success("New habit planted 🌱", {
      description: activePet
        ? `${activePet.name} sẽ cổ vũ bạn từ hôm nay.`
        : "Bé cưng trong vườn sẽ cổ vũ bạn từ hôm nay."
    });
  }

  function removeHabit(habitId: string) {
    setState((current) => removeHabitFromState(current, habitId));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          className="flex items-center gap-2.5 font-display text-base font-bold text-plum"
          href="/dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-matcha-deep font-display text-sm text-white shadow-mochi">
            BM
          </span>
          BetterMe
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-wafer bg-mochi p-1.5 shadow-mochi">
          <span className="max-w-[200px] truncate px-2 text-xs font-bold text-mauve">
            {userEmail}
          </span>
          <button
            className="squishy rounded-full px-3.5 py-2 text-sm font-bold text-plum transition hover:bg-rice"
            onClick={handleSignOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <GreetingHero
          bubble={bubble}
          celebrate={celebrate}
          eating={eating}
          onAdopt={handleAdopt}
          onFeed={feedPet}
          onOpenGift={handleOpenGift}
          onPet={petThePet}
          onSwitch={handleSwitchPet}
          viewModel={viewModel}
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,18fr)_minmax(320px,6fr)] xl:items-start">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[repeat(18,minmax(0,1fr))]">
            <TodaysHabits
              habits={viewModel.habits}
              onAdd={addHabit}
              onRemove={removeHabit}
              onToggle={toggleHabit}
              viewModel={viewModel}
            />
            <CalendarPanel days={viewModel.calendar.days} viewModel={viewModel} />
            <UpcomingEvents viewModel={viewModel} />
            <AnalyticsPanel viewModel={viewModel} />
          </div>
          <aside
            aria-label="Weather and Spotify highlights"
            className="grid gap-5 xl:sticky xl:top-5"
          >
            <WeatherCard />
            <SpotifyCard />
          </aside>
        </div>
      </div>
    </main>
  );
}

type CompanionHandlers = {
  bubble: string | null;
  eating: boolean;
  onAdopt: (species: PetSpecies, name: string) => void;
  onFeed: () => void;
  onOpenGift: () => void;
  onPet: () => void;
  onSwitch: (species: PetSpecies) => void;
};

function GreetingHero({
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
  const goodDaysThisMonth = viewModel.calendar.days.filter(
    (day) => day.inCurrentMonth && day.status === "Good"
  ).length;

  return (
    <section className="soft-panel card-lift overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wide text-matcha-deep">
            {viewModel.date.longLabel}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-plum sm:text-4xl">
            {viewModel.greeting}, Thiên
          </h1>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricPill
              icon={CheckCircle2}
              label="Today"
              tone="matcha"
              value={`${viewModel.today.completedHabits}/${viewModel.today.totalHabits}`}
            />
            <MetricPill
              icon={Sprout}
              label="7-day rhythm"
              tone="sakura"
              value={formatPercent(viewModel.streak.rhythm)}
            />
            <MetricPill
              icon={Flower2}
              label="Good days"
              tone="butter"
              value={`${goodDaysThisMonth} this month`}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-wafer bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-label="Last seven days rhythm" className="flex items-center gap-2">
              {viewModel.streak.chain.map((day) => (
                <span
                  aria-label={`${day.label}: ${day.status}`}
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border transition",
                    day.completed
                      ? "border-matcha-deep/50 bg-matcha shadow-[0_0_0_4px_rgba(127,176,105,0.16)]"
                      : "border-wafer bg-white"
                  )}
                  key={day.date}
                  title={`${day.label}: ${day.status}`}
                />
              ))}
            </div>
            <p className="text-sm font-bold text-mauve">
              {viewModel.streak.protectionMessage}
            </p>
          </div>
        </div>

        <div className="flex justify-center lg:pr-2">
          <CompanionCorner
            bubble={bubble}
            celebrate={celebrate}
            eating={eating}
            onAdopt={onAdopt}
            onFeed={onFeed}
            onOpenGift={onOpenGift}
            onPet={onPet}
            onSwitch={onSwitch}
            viewModel={viewModel}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * The pet's home inside the hero: adoption eggs on first run, then the
 * companion with speech bubble, bond meter, food tray, and pet switcher.
 */
function CompanionCorner({
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
        <span aria-label={`Bond tier ${pet.bondTier} of 5`} className="flex items-center gap-0.5">
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
      <span aria-label={`${food} treats in the pantry`} className="text-sm font-bold text-plum">
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

function MetricPill({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "matcha" | "sakura" | "butter";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/75 p-4",
        tone === "matcha" && "border-matcha/40",
        tone === "sakura" && "border-sakura",
        tone === "butter" && "border-butter"
      )}
    >
      <div className="flex items-center gap-2 text-sm font-bold text-mauve">
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "matcha" && "text-matcha-deep",
            tone === "sakura" && "text-sakura-deep",
            tone === "butter" && "text-honey"
          )}
        />
        {label}
      </div>
      <p className="mt-2 font-display text-xl font-bold text-plum sm:text-2xl">{value}</p>
    </div>
  );
}

function CalendarPanel({
  days,
  viewModel
}: {
  days: DashboardCalendarDay[];
  viewModel: DashboardViewModel;
}) {
  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:1/1/2/8]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">Calendar</h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            {viewModel.date.monthLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-matcha/40 bg-matcha/10 px-3 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-matcha-deep">Month</p>
          <p className="font-display text-lg font-bold text-matcha-deep">
            {formatPercent(viewModel.calendar.monthCompletionRate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-mauve">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div className="py-1" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            aria-label={`${day.label}, ${day.completedHabits} of ${day.totalHabits} habits, ${day.status}`}
            className={cn(
              "mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-wafer text-xs font-bold sm:h-9 sm:w-9",
              day.inCurrentMonth ? "text-plum" : "border-wafer/50 text-mauve/40",
              day.fillRatio >= 1 &&
                day.inCurrentMonth &&
                "border-transparent text-white shadow-[0_2px_8px_rgba(76,122,67,0.28)]",
              day.isToday && "ring-2 ring-sakura-deep ring-offset-2"
            )}
            key={day.date}
            role="img"
            style={calendarCellStyle(day)}
            title={`${day.label}: ${day.completedHabits}/${day.totalHabits} habits`}
          >
            {day.day}
          </div>
        ))}
      </div>
    </section>
  );
}

function TodaysHabits({
  habits,
  onAdd,
  onRemove,
  onToggle,
  viewModel
}: {
  habits: DashboardHabitView[];
  onAdd: (name: string, category: string) => void;
  onRemove: (habitId: string) => void;
  onToggle: (habitId: string) => void;
  viewModel: DashboardViewModel;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(HABIT_CATEGORIES[0]);
  const easyWinId = findEasyWin(habits);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    onAdd(name, category);
    setName("");
    setShowForm(false);
  }

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:1/8/3/19]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-plum">
            Today&apos;s Habits
          </h2>
          <p className="mt-1 text-sm font-semibold text-mauve">
            {viewModel.today.completedHabits} of {viewModel.today.totalHabits} completed
          </p>
        </div>
        <StatusBadge status={viewModel.today.status} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-mauve">
          <span>Today progress</span>
          <span className="text-plum">{formatPercent(viewModel.today.completionRate)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-wafer">
          <div
            className="h-full rounded-full bg-gradient-to-r from-matcha to-matcha-deep transition-all duration-500"
            style={{ width: `${viewModel.today.completionRate * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {habits.map((habit) => (
          <HabitRow
            editing={editing}
            habit={habit}
            isEasyWin={habit.id === easyWinId}
            key={habit.id}
            onRemove={onRemove}
            onToggle={onToggle}
          />
        ))}
      </div>

      {showForm ? (
        <form
          className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-wafer bg-rice/70 p-3"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="new-habit-name">
            Habit name
          </label>
          <input
            autoFocus
            className="h-10 min-w-0 flex-1 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum placeholder:text-mauve/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-habit-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="A tiny habit, e.g. Drink water"
            value={name}
          />
          <label className="sr-only" htmlFor="new-habit-category">
            Category
          </label>
          <select
            className="h-10 rounded-full border border-wafer bg-white px-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="new-habit-category"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {HABIT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button type="submit">Plant it</Button>
          <Button onClick={() => setShowForm(false)} type="button" variant="ghost">
            Cancel
          </Button>
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setShowForm(true)} type="button" variant="outline">
            <CirclePlus className="h-4 w-4" />
            Add a habit
          </Button>
          <Button
            aria-pressed={editing}
            onClick={() => setEditing((current) => !current)}
            type="button"
            variant="ghost"
          >
            {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editing ? "Done" : "Edit"}
          </Button>
        </div>
      )}
    </section>
  );
}

function findEasyWin(habits: DashboardHabitView[]) {
  const remaining = habits.filter((habit) => !habit.completed);

  if (!remaining.length || remaining.length === habits.length) return null;

  return remaining.reduce((easiest, habit) =>
    habit.maxScore < easiest.maxScore ? habit : easiest
  ).id;
}

function HabitRow({
  editing,
  habit,
  isEasyWin,
  onRemove,
  onToggle
}: {
  editing: boolean;
  habit: DashboardHabitView;
  isEasyWin: boolean;
  onRemove: (habitId: string) => void;
  onToggle: (habitId: string) => void;
}) {
  const emoji = habitEmoji(habit.key, habit.category);

  return (
    <div className="relative">
      <button
        aria-pressed={habit.completed}
        className={cn(
          "squishy grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border bg-white/80 p-3 text-left shadow-mochi transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2",
          habit.completed ? "border-matcha/50 bg-matcha/5" : "border-wafer"
        )}
        onClick={() => onToggle(habit.id)}
        type="button"
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition",
            habitIconBubbleClass(habit.key, habit.category)
          )}
        >
          <span
            aria-label={`${habit.name} emoji icon`}
            className="text-2xl leading-none drop-shadow-sm"
            role="img"
          >
            {emoji}
          </span>
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "inline-block max-w-full truncate align-top text-sm font-bold",
              habit.completed ? "crayon-strike text-mauve" : "text-plum"
            )}
          >
            {habit.name}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs font-bold text-mauve">
            <span className="truncate">{habit.category}</span>
            {isEasyWin && !habit.completed ? (
              <span className="shrink-0 rounded-full bg-butter/50 px-2 py-0.5 text-[10px] font-bold text-plum">
                ✨ easy win
              </span>
            ) : null}
          </span>
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
            habit.completed
              ? "check-pop border-matcha bg-matcha text-white"
              : "border-wafer bg-white text-transparent"
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3.5} />
        </span>
      </button>
      {editing ? (
        <button
          aria-label={`Remove ${habit.name}`}
          className="squishy absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-sakura-deep text-white shadow-mochi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep focus-visible:ring-offset-2"
          onClick={() => onRemove(habit.id)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function habitEmoji(key: string, category?: string) {
  const byKey: Record<string, string> = {
    wake_up: "⏰",
    english: "🗣️",
    coding: "💻",
    exercise: "💪",
    focus: "🎯",
    clean: "✨",
    review: "📝"
  };

  const byCategory: Record<string, string> = {
    Discipline: "🛡️",
    Learning: "📚",
    Work: "🚀",
    Health: "💚",
    Reflection: "🌙"
  };

  return byKey[key] || byCategory[category || ""] || "⭐";
}

function habitIconBubbleClass(key: string, category?: string) {
  const bubbleByKey: Record<string, string> = {
    wake_up: "border-butter/70 bg-gradient-to-br from-butter/30 via-sakura/20 to-white",
    english: "border-dawn/70 bg-gradient-to-br from-dawn/30 via-white to-white",
    coding: "border-mauve/20 bg-gradient-to-br from-wafer via-white to-white",
    exercise: "border-matcha/50 bg-gradient-to-br from-matcha/25 via-white to-white",
    focus: "border-sakura bg-gradient-to-br from-sakura/40 via-white to-white",
    clean: "border-butter/70 bg-gradient-to-br from-butter/35 via-white to-white",
    review: "border-dawn/60 bg-gradient-to-br from-dawn/25 via-sakura/15 to-white"
  };

  const bubbleByCategory: Record<string, string> = {
    Discipline: "border-matcha/50 bg-gradient-to-br from-matcha/20 via-white to-white",
    Learning: "border-dawn/70 bg-gradient-to-br from-dawn/25 via-white to-white",
    Work: "border-mauve/20 bg-gradient-to-br from-wafer via-white to-white",
    Health: "border-matcha/50 bg-gradient-to-br from-matcha/25 via-white to-white",
    Reflection: "border-sakura bg-gradient-to-br from-sakura/30 via-white to-white"
  };

  return (
    bubbleByKey[key] ||
    bubbleByCategory[category || ""] ||
    "border-wafer bg-gradient-to-br from-white via-rice to-white"
  );
}

function WeatherCard() {
  const metricItems = [
    ["Humidity", DASHBOARD_WEATHER.humidity],
    ["Wind", DASHBOARD_WEATHER.wind],
    ["Rain", DASHBOARD_WEATHER.rainChance],
    ["UV", DASHBOARD_WEATHER.uvIndex]
  ];

  return (
    <section className="soft-panel card-lift dawn-band relative overflow-hidden rounded-lg p-4 sm:p-5">
      <div className="relative z-10 flex min-h-[280px] flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-dawn-deep">
              Weather
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-plum">
              {DASHBOARD_WEATHER.location} weather
            </h2>
            <p className="mt-1 text-sm font-bold text-mauve">
              {DASHBOARD_WEATHER.condition}
            </p>
          </div>
          <span
            aria-label={DASHBOARD_WEATHER.emojiLabel}
            className="weather-emoji"
            role="img"
          >
            {DASHBOARD_WEATHER.emoji}
          </span>
        </div>

        <div>
          <p className="font-display text-5xl font-bold text-plum sm:text-6xl">
            {DASHBOARD_WEATHER.temperature}
          </p>
          <p className="mt-2 text-sm font-bold text-mauve">
            Feels like {DASHBOARD_WEATHER.feelsLike}
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-mauve">
            {DASHBOARD_WEATHER.planningNote}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {metricItems.map(([label, value]) => (
            <div className="rounded-2xl border border-wafer bg-white/75 p-3" key={label}>
              <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                {label}
              </p>
              <p className="mt-1 text-sm font-bold text-plum">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotifyCard() {
  return (
    <section className="card-lift overflow-hidden rounded-lg bg-[#15171A] p-4 text-white shadow-mochi ring-1 ring-white/10 sm:p-5">
      <div className="grid gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#1db954]">
              Spotify
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Focus session
            </h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/70">
              Deep Focus by Spotify, ready for coding blocks and quiet review.
            </p>
          </div>

          <a
            className="squishy inline-flex w-fit items-center rounded-full bg-[#1db954] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15171A]"
            href={SPOTIFY_PLAYLIST_URL}
            rel="noreferrer"
            target="_blank"
          >
            Open in Spotify
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block h-[352px] w-full border-0"
            loading="lazy"
            src={SPOTIFY_EMBED_URL}
            title="Spotify Deep Focus playlist"
          />
        </div>
      </div>
    </section>
  );
}

function UpcomingEvents({ viewModel }: { viewModel: DashboardViewModel }) {
  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:2/1/3/8]">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-matcha-deep" />
        <h2 className="font-display text-lg font-bold text-plum">Upcoming Events</h2>
      </div>

      <div className="grid gap-3">
        {viewModel.events.map((event) => (
          <div
            className="rounded-2xl border border-wafer bg-white/75 p-3"
            key={event.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-plum">{event.title}</p>
                <p className="mt-1 text-xs font-bold text-mauve">{event.time}</p>
              </div>
              <span className="rounded-full bg-sakura/40 px-2.5 py-1 text-xs font-bold capitalize text-sakura-deep">
                {event.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsPanel({ viewModel }: { viewModel: DashboardViewModel }) {
  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:3/1/4/19]">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-dawn-deep" />
            <h2 className="font-display text-lg font-bold text-plum">Analytics</h2>
          </div>
          <p className="mt-1 text-sm font-semibold text-mauve">
            Habit performance and recent trend
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SmallMetric
            label="Average"
            value={formatPercent(viewModel.analytics.averageCompletionRate)}
          />
          <SmallMetric
            label="Trend"
            value={formatSignedPercent(viewModel.analytics.changeFromPreviousPeriod)}
          />
          <SmallMetric label="Good days" value={`${viewModel.analytics.goodDays}`} />
          <SmallMetric
            label="Completed"
            value={`${viewModel.analytics.totalCompletedHabits}`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-2xl border border-wafer bg-white/75 p-4">
          <div className="flex h-48 items-end gap-2">
            {viewModel.analytics.trend.map((point, index) => (
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.date}>
                <div className="flex h-36 w-full items-end rounded-xl bg-rice">
                  <div
                    aria-label={`${point.label}: ${formatPercent(point.completionRate)}`}
                    className={cn(
                      "bar-grow w-full rounded-xl",
                      point.status === "Good" && "bg-matcha",
                      point.status === "Okay" && "bg-honey",
                      point.status === "Bad" && "bg-sakura",
                      point.status === "No data" && "bg-wafer"
                    )}
                    style={
                      {
                        height: `${Math.max(point.completionRate * 100, 6)}%`,
                        "--bar-delay": `${index * 30}ms`
                      } as React.CSSProperties
                    }
                    title={`${point.label}: ${formatPercent(point.completionRate)}`}
                  />
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-[10px] font-bold text-mauve",
                    index % 2 === 1 && "hidden sm:block"
                  )}
                >
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-wafer bg-white/75 p-4">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Insight label="Most steady" value={viewModel.analytics.mostConsistentHabitName} />
            <Insight
              label="Needs care"
              value={viewModel.analytics.habitNeedingAttentionName}
            />
          </div>
          <div className="grid gap-3">
            {viewModel.analytics.habitPerformance.slice(0, 5).map((habit) => (
              <div key={habit.habitId}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-mauve">
                  <span className="truncate">{habit.habitName}</span>
                  <span className="text-plum">{formatPercent(habit.completionRate)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-wafer">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-matcha to-matcha-deep"
                    style={{ width: `${habit.completionRate * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-wafer bg-white/75 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-mauve">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-plum">{value}</p>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-wafer bg-white/75 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-mauve">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-plum">{value ?? "No habit yet"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-2 text-sm font-bold",
        status === "Good" && "bg-matcha/15 text-matcha-deep",
        status === "Okay" && "bg-butter/40 text-[#8A5A17]",
        status === "Bad" && "bg-sakura/40 text-sakura-deep",
        status === "No data" && "bg-wafer text-mauve"
      )}
    >
      {status}
    </span>
  );
}

function calendarCellStyle(day: DashboardCalendarDay) {
  const fillPercent = Math.round(day.fillRatio * 100);
  const fillColor = getCalendarFill(day.status);
  const trackColor = day.inCurrentMonth
    ? "rgba(245,230,224,0.95)"
    : "rgba(245,230,224,0.45)";

  if (day.fillRatio >= 1 && day.inCurrentMonth) {
    return {
      background: "#4C7A43"
    };
  }

  return {
    background: `radial-gradient(circle at center, rgba(255,255,255,0.98) 82%, transparent 83%), conic-gradient(${fillColor} ${fillPercent}%, ${trackColor} 0)`
  };
}

function getCalendarFill(status: DashboardStatus) {
  if (status === "Good") return "rgb(127, 176, 105)";
  if (status === "Okay") return "rgb(242, 176, 76)";
  if (status === "Bad") return "rgb(246, 198, 206)";
  return "rgba(111, 96, 105, 0.22)";
}

function formatSignedPercent(value: number) {
  const rounded = Math.round(value * 100);
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
}
