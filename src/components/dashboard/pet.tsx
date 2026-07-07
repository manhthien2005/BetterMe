"use client";

import { useEffect, useRef, useState } from "react";

import type {
  BondTier,
  PetSpecies,
  PetStage
} from "@/components/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

/**
 * The raisable companion — a dog or a cat, pure SVG like Nếp before it.
 * One shared blob skeleton; species layers swap ears, tail, muzzle and
 * whiskers; growth stages scale the whole body up from the same ground
 * line; bond tiers dress the pet up. Level-2 liveliness: pupils follow
 * the cursor, a morning stretch after sunrise, sleepy eyes late at
 * night, tap-to-pet hearts, an idle fidget so it never stands still.
 */

const PLUM = "#4A3D46";
const MAUVE = "#6F6069";
const BODY = "#FFFDF8";
const MUZZLE = "#FFF6EC";
const MATCHA = "#7FB069";
const MATCHA_DEEP = "#4C7A43";
const SAKURA = "#F6C6CE";
const SAKURA_DEEP = "#C94F6D";
const BUTTER = "#FFD98E";
const HONEY = "#F2B04C";
const DAWN_FISH = "#A9C6E8";

const STAGE_SCALE: Record<PetStage, number> = {
  baby: 0.74,
  kid: 0.84,
  junior: 0.91,
  teen: 0.96,
  adult: 1
};

const STAGE_LABEL: Record<PetStage, string> = {
  baby: "baby",
  kid: "kid",
  junior: "junior",
  teen: "teen",
  adult: "adult"
};

export type PetMood = "asleep" | "neutral" | "happy" | "delighted" | "party";

export function getPetMood(completedCount: number, totalCount: number): PetMood {
  if (totalCount <= 0 || completedCount <= 0) return "asleep";

  const rate = completedCount / totalCount;

  if (rate >= 1) return "party";
  if (rate > 0.67) return "delighted";
  if (rate > 0.34) return "happy";
  return "neutral";
}

const MOOD_LABEL: Record<PetMood, string> = {
  asleep: "fast asleep",
  neutral: "waking up",
  happy: "happy",
  delighted: "delighted",
  party: "celebrating a perfect day"
};

const CONFETTI_PIECES = [
  { dx: "-52px", dy: "-64px", delay: "0ms", clr: SAKURA },
  { dx: "-30px", dy: "-84px", delay: "40ms", clr: BUTTER },
  { dx: "-10px", dy: "-70px", delay: "90ms", clr: MATCHA },
  { dx: "12px", dy: "-88px", delay: "20ms", clr: SAKURA },
  { dx: "32px", dy: "-72px", delay: "70ms", clr: BUTTER },
  { dx: "54px", dy: "-60px", delay: "110ms", clr: MATCHA },
  { dx: "-42px", dy: "-40px", delay: "60ms", clr: BUTTER },
  { dx: "44px", dy: "-44px", delay: "100ms", clr: SAKURA }
] as const;

const HEARTS = [
  { drift: "-20px", delay: "0ms" },
  { drift: "2px", delay: "140ms" },
  { drift: "20px", delay: "260ms" }
] as const;

export function Pet({
  species,
  name,
  stage,
  bondTier,
  completedCount,
  totalCount,
  celebrate = false,
  eating = false,
  onPet
}: {
  species: PetSpecies;
  name: string;
  stage: PetStage;
  bondTier: BondTier;
  completedCount: number;
  totalCount: number;
  celebrate?: boolean;
  eating?: boolean;
  onPet?: () => void;
}) {
  const mood = getPetMood(completedCount, totalCount);
  const [squash, setSquash] = useState(false);
  const [petting, setPetting] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [stretching, setStretching] = useState(false);
  const [dayPhase, setDayPhase] = useState<"day" | "morning" | "night">("day");
  const previousCount = useRef(completedCount);
  const previousStage = useRef(stage);
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (completedCount === previousCount.current) return;

    previousCount.current = completedCount;
    setSquash(true);
    const timer = window.setTimeout(() => setSquash(false), 450);

    return () => window.clearTimeout(timer);
  }, [completedCount]);

  useEffect(() => {
    if (stage === previousStage.current) return;

    previousStage.current = stage;
    setEvolving(true);
    const timer = window.setTimeout(() => setEvolving(false), 1100);

    return () => window.clearTimeout(timer);
  }, [stage]);

  // Time-of-day mood is decided after mount so SSR and client agree.
  // The morning stretch plays exactly once, right after sunrise mount.
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 9) {
      setDayPhase("morning");
      setStretching(true);
      const timer = window.setTimeout(() => setStretching(false), 950);

      return () => window.clearTimeout(timer);
    }

    if (hour >= 21 || hour < 5) setDayPhase("night");
  }, []);

  // Level 2: pupils follow the cursor. Direct DOM writes via rAF — zero
  // re-renders. Skipped for touch-only devices and reduced motion.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }

    let frame = 0;

    function follow(event: PointerEvent) {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const svg = svgRef.current;
        const pupils = pupilsRef.current;

        if (!svg || !pupils) return;

        const rect = svg.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height * 0.45);
        const length = Math.hypot(dx, dy) || 1;
        const reach = Math.min(2.6, length / 36);

        pupils.setAttribute(
          "transform",
          `translate(${((dx / length) * reach).toFixed(2)} ${((dy / length) * reach).toFixed(2)})`
        );
      });
    }

    window.addEventListener("pointermove", follow);

    return () => {
      window.removeEventListener("pointermove", follow);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function handlePet() {
    setPetting(true);
    window.setTimeout(() => setPetting(false), 1000);
    onPet?.();
  }

  const sleepy = dayPhase === "night" && (mood === "neutral" || mood === "happy");
  const eyesClosed = mood === "asleep" || sleepy;
  const scale = STAGE_SCALE[stage];
  const blushStrong = mood === "delighted" || mood === "party" || petting;

  return (
    <div className={cn("relative", mood !== "asleep" && "pet-fidget")}>
      {celebrate ? (
        <div aria-hidden="true" className="absolute inset-0">
          {CONFETTI_PIECES.map((piece, index) => (
            <span
              className="confetti-piece"
              key={index}
              style={
                {
                  "--dx": piece.dx,
                  "--dy": piece.dy,
                  "--delay": piece.delay,
                  "--clr": piece.clr
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      {petting ? (
        <div aria-hidden="true" className="absolute inset-0">
          {HEARTS.map((heart, index) => (
            <span
              className="pet-heart"
              key={index}
              style={
                {
                  "--drift": heart.drift,
                  "--delay": heart.delay
                } as React.CSSProperties
              }
            >
              💗
            </span>
          ))}
        </div>
      ) : null}

      <button
        aria-label={`Pet ${name}`}
        className="squishy cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
        onClick={handlePet}
        type="button"
      >
        <svg
          aria-label={`${name} the ${species}, ${STAGE_LABEL[stage]} stage, ${MOOD_LABEL[mood]}`}
          className={cn(
            squash || petting
              ? "nep-squash"
              : stretching && mood !== "asleep"
                ? "pet-stretch"
                : mood !== "asleep"
                  ? "nep-idle"
                  : undefined
          )}
          height="130"
          ref={svgRef}
          role="img"
          viewBox="0 0 160 130"
          width="160"
        >
          {/* ground shadow stays put; the pet grows up from it */}
          <ellipse cx="80" cy="118" fill={PLUM} opacity="0.07" rx={40 * scale} ry="5" />

          {evolving ? (
            <circle
              className="pet-evolve-ring"
              cx="80"
              cy="78"
              fill="none"
              r="34"
              stroke={BUTTER}
              strokeWidth="6"
            />
          ) : null}

          <g transform={`translate(80 114) scale(${scale}) translate(-80 -114)`}>
            {species === "dog" ? (
              <DogLayerBack petting={petting} />
            ) : (
              <CatLayerBack />
            )}

            {/* body */}
            <path
              d={
                mood === "asleep"
                  ? "M80 40 C50 40 36 56 36 80 C36 104 54 114 80 114 C106 114 114 104 124 80 C124 56 110 40 80 40 Z"
                  : "M80 34 C50 34 36 52 36 78 C36 104 54 114 80 114 C106 114 124 104 124 78 C124 52 110 34 80 34 Z"
              }
              fill={BODY}
              stroke={PLUM}
              strokeWidth="3"
            />

            {species === "dog" ? (
              <DogLayerFront stage={stage} />
            ) : (
              <CatLayerFront stage={stage} />
            )}

            {/* blush — pumps like cheeks while chewing */}
            <g className={eating ? "pet-chew" : undefined}>
              <ellipse
                cx="48"
                cy="82"
                fill={SAKURA}
                opacity={blushStrong ? 0.85 : 0.5}
                rx="7"
                ry="4"
              />
              <ellipse
                cx="112"
                cy="82"
                fill={SAKURA}
                opacity={blushStrong ? 0.85 : 0.5}
                rx="7"
                ry="4"
              />
            </g>

            {/* eyes */}
            {eyesClosed ? (
              <g fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="3">
                <path d="M54 66 Q60 71 66 66" />
                <path d="M94 66 Q100 71 106 66" />
              </g>
            ) : mood === "party" ? (
              <g fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="3.5">
                <path d="M54 68 Q60 60 66 68" />
                <path d="M94 68 Q100 60 106 68" />
              </g>
            ) : (
              <g>
                <g ref={pupilsRef}>
                  <circle cx="60" cy="66" fill={PLUM} r={stage === "baby" ? 5.6 : 4.8} />
                  <circle cx="100" cy="66" fill={PLUM} r={stage === "baby" ? 5.6 : 4.8} />
                  <circle cx="61.7" cy="64.3" fill="#FFFFFF" r="1.6" />
                  <circle cx="101.7" cy="64.3" fill="#FFFFFF" r="1.6" />
                </g>
                {/* eyelids blink every few seconds */}
                <g fill={BODY}>
                  <rect className="pet-blink" height="13" rx="6" width="15" x="52.5" y="59.5" />
                  <rect className="pet-blink" height="13" rx="6" width="15" x="92.5" y="59.5" />
                </g>
              </g>
            )}

            {/* muzzle + mouth */}
            {species === "dog" ? (
              <DogMouth eating={eating} mood={mood} />
            ) : (
              <CatMouth eating={eating} mood={mood} />
            )}

            {/* bond accessories: the closer you are, the fancier the fit */}
            <BondAccessory bondTier={bondTier} species={species} />

            {/* flying treat while eating */}
            {eating ? (
              <g className="pet-food-arc">
                {species === "dog" ? (
                  <g transform="translate(80 92)">
                    <rect fill={BUTTER} height="5" rx="2.5" stroke={HONEY} width="16" x="-8" y="-2.5" />
                    <circle cx="-8" cy="-2.5" fill={BUTTER} r="3.4" stroke={HONEY} strokeWidth="1" />
                    <circle cx="-8" cy="2.5" fill={BUTTER} r="3.4" stroke={HONEY} strokeWidth="1" />
                    <circle cx="8" cy="-2.5" fill={BUTTER} r="3.4" stroke={HONEY} strokeWidth="1" />
                    <circle cx="8" cy="2.5" fill={BUTTER} r="3.4" stroke={HONEY} strokeWidth="1" />
                  </g>
                ) : (
                  <g transform="translate(80 92)">
                    <ellipse cx="-2" cy="0" fill={DAWN_FISH} rx="8" ry="5" />
                    <path d="M5 0 L12 -5 L12 5 Z" fill={DAWN_FISH} />
                    <circle cx="-5" cy="-1" fill={PLUM} r="1" />
                  </g>
                )}
              </g>
            ) : null}
          </g>

          {/* zzz while asleep */}
          {mood === "asleep" ? (
            <g
              fill={MAUVE}
              fontFamily="var(--font-display), 'Baloo 2', sans-serif"
              fontWeight="700"
            >
              <text className="nep-zzz" fontSize="11" x="116" y="48">
                z
              </text>
              <text className="nep-zzz" fontSize="14" style={{ animationDelay: "1.3s" }} x="124" y="36">
                z
              </text>
              <text className="nep-zzz" fontSize="17" style={{ animationDelay: "2.6s" }} x="133" y="24">
                z
              </text>
            </g>
          ) : null}
        </svg>
      </button>
    </div>
  );
}

function DogLayerBack({ petting }: { petting: boolean }) {
  return (
    <g>
      {/* wagging tail — goes into overdrive when petted */}
      <path
        className={petting ? "pet-tail-wag-fast" : "pet-tail-wag"}
        d="M118 98 C130 96 139 86 136 72 C133 76 129 84 122 90 C119 93 118 95 118 98 Z"
        fill={BUTTER}
        stroke={PLUM}
        strokeWidth="2.5"
      />
    </g>
  );
}

function DogLayerFront({ stage }: { stage: PetStage }) {
  return (
    <g>
      {/* floppy ears */}
      <path
        d="M54 40 C44 32 34 42 38 58 C41 68 50 71 55 63 C58 55 58 47 54 40 Z"
        fill={BUTTER}
        stroke={PLUM}
        strokeWidth="3"
      />
      <path
        className="pet-ear-twitch"
        d="M106 40 C116 32 126 42 122 58 C119 68 110 71 105 63 C102 55 102 47 106 40 Z"
        fill={BUTTER}
        stroke={PLUM}
        strokeWidth="3"
      />
      {/* a butter patch over one eye once the pup is grown enough */}
      {stage === "junior" || stage === "teen" || stage === "adult" ? (
        <ellipse cx="57" cy="57" fill={BUTTER} opacity="0.5" rx="10" ry="8" />
      ) : null}
    </g>
  );
}

function DogMouth({ eating, mood }: { eating: boolean; mood: PetMood }) {
  return (
    <g>
      <ellipse cx="80" cy="90" fill={MUZZLE} rx="15" ry="11" />
      <ellipse cx="80" cy="84.5" fill={PLUM} rx="4.5" ry="3.4" />
      {eating ? (
        <ellipse cx="80" cy="95" fill={PLUM} rx="5.5" ry="4.5" />
      ) : mood === "asleep" ? (
        <path d="M75 94 Q80 97 85 94" fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="2.5" />
      ) : mood === "neutral" ? (
        <path d="M74 92 Q80 96 86 92" fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="3" />
      ) : mood === "happy" ? (
        <path d="M72 91 Q80 98 88 91" fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="3" />
      ) : (
        <g>
          <path d="M72 90 Q80 101 88 90 Z" fill={PLUM} />
          {/* tongue out — peak dog happiness */}
          <path d="M76 95 Q80 103 84 95 Z" fill={SAKURA_DEEP} opacity="0.9" />
        </g>
      )}
    </g>
  );
}

function CatLayerBack() {
  return (
    <g>
      {/* superior S-curve tail with a sakura tip */}
      <g className="pet-tail-sway">
        <path
          d="M116 100 C132 99 142 86 135 66 C134 62 128 63 129 67 C134 82 126 92 114 94 Z"
          fill={BODY}
          stroke={PLUM}
          strokeWidth="2.5"
        />
        <circle cx="131.5" cy="66" fill={SAKURA} r="4" stroke={PLUM} strokeWidth="2" />
      </g>
    </g>
  );
}

function CatLayerFront({ stage }: { stage: PetStage }) {
  return (
    <g>
      {/* pointy ears, one of them flicks */}
      <g className="pet-ear-twitch">
        <path d="M50 46 L55 18 L75 37 Z" fill={BODY} stroke={PLUM} strokeWidth="3" />
        <path d="M56 39 L59 27 L69 35 Z" fill={SAKURA} />
      </g>
      <path d="M110 46 L105 18 L85 37 Z" fill={BODY} stroke={PLUM} strokeWidth="3" />
      <path d="M104 39 L101 27 L91 35 Z" fill={SAKURA} />
      {/* whiskers */}
      <g fill="none" stroke={MAUVE} strokeLinecap="round" strokeWidth="1.8">
        <path d="M30 76 L52 79" />
        <path d="M29 84 L52 84" />
        <path d="M31 92 L53 88" />
        <path d="M130 76 L108 79" />
        <path d="M131 84 L108 84" />
        <path d="M129 92 L107 88" />
      </g>
      {/* forehead stripes once grown */}
      {stage === "teen" || stage === "adult" ? (
        <g fill="none" opacity="0.8" stroke={HONEY} strokeLinecap="round" strokeWidth="3.5">
          <path d="M72 40 q2 5 0 9" />
          <path d="M80 38 q2 5 0 9" />
          <path d="M88 40 q-2 5 0 9" />
        </g>
      ) : null}
    </g>
  );
}

function CatMouth({ eating, mood }: { eating: boolean; mood: PetMood }) {
  return (
    <g>
      <path d="M80 82 L80 87" stroke={PLUM} strokeLinecap="round" strokeWidth="2.4" />
      {eating ? (
        <ellipse cx="80" cy="91" fill={PLUM} rx="5" ry="4" />
      ) : mood === "asleep" ? (
        <path d="M74 88 Q77 91 80 88 Q83 91 86 88" fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="2.4" />
      ) : mood === "neutral" || mood === "happy" ? (
        <path d="M72 87 Q76 92 80 87 Q84 92 88 87" fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="2.6" />
      ) : (
        <path d="M72 87 Q80 97 88 87 Z" fill={PLUM} />
      )}
    </g>
  );
}

function BondAccessory({
  bondTier,
  species
}: {
  bondTier: BondTier;
  species: PetSpecies;
}) {
  if (bondTier >= 5) {
    // flower crown — family status
    const y = species === "cat" ? 24 : 30;

    return (
      <g>
        {[66, 80, 94].map((x) => (
          <g key={x}>
            <circle cx={x} cy={x === 80 ? y - 3 : y} fill={SAKURA} r="4" stroke={SAKURA_DEEP} strokeWidth="1" />
            <circle cx={x} cy={x === 80 ? y - 3 : y} fill={BUTTER} r="1.7" />
          </g>
        ))}
      </g>
    );
  }

  if (bondTier === 4) {
    return species === "dog" ? (
      <path d="M62 102 L98 102 L80 114 Z" fill={HONEY} stroke={PLUM} strokeWidth="2" />
    ) : (
      <Bow color={MATCHA} outline={MATCHA_DEEP} />
    );
  }

  if (bondTier === 3) {
    return species === "dog" ? (
      <path d="M62 102 L98 102 L80 114 Z" fill={MATCHA} stroke={PLUM} strokeWidth="2" />
    ) : (
      <Bow color={SAKURA} outline={SAKURA_DEEP} />
    );
  }

  return null;
}

function Bow({ color, outline }: { color: string; outline: string }) {
  return (
    <g>
      <path d="M80 104 L68 98 L68 110 Z" fill={color} stroke={outline} strokeWidth="1.5" />
      <path d="M80 104 L92 98 L92 110 Z" fill={color} stroke={outline} strokeWidth="1.5" />
      <circle cx="80" cy="104" fill={color} r="3.4" stroke={outline} strokeWidth="1.5" />
    </g>
  );
}

/** The saved present a pet keeps for you after days away. Never guilt — always a gift. */
export function GiftBox({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <button
      aria-label={label}
      className="squishy absolute -right-1 bottom-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-deep focus-visible:ring-offset-2"
      onClick={onOpen}
      type="button"
    >
      <svg aria-hidden="true" className="gift-bounce" height="44" viewBox="0 0 44 44" width="44">
        <rect fill={SAKURA} height="20" rx="4" stroke={SAKURA_DEEP} strokeWidth="2" width="28" x="8" y="18" />
        <rect fill={SAKURA} height="7" rx="3" stroke={SAKURA_DEEP} strokeWidth="2" width="34" x="5" y="13" />
        <path d="M22 13 L22 38" stroke={SAKURA_DEEP} strokeWidth="2.5" />
        <path d="M22 13 C16 13 14 7 18 5 C21 3.5 23 8 22 13 Z" fill={BUTTER} stroke={SAKURA_DEEP} strokeWidth="1.5" />
        <path d="M22 13 C28 13 30 7 26 5 C23 3.5 21 8 22 13 Z" fill={BUTTER} stroke={SAKURA_DEEP} strokeWidth="1.5" />
      </svg>
    </button>
  );
}

const EGG_SPECIES: Array<{
  species: PetSpecies;
  title: string;
  hint: string;
  spot: string;
}> = [
  { species: "dog", title: "Cún con", hint: "nhiệt tình, trung thành", spot: BUTTER },
  { species: "cat", title: "Mèo con", hint: "kiêu kỳ, thầm quan tâm", spot: SAKURA }
];

const DEFAULT_NAME_PLACEHOLDER: Record<PetSpecies, string> = {
  dog: "Xoài",
  cat: "Mochi"
};

/**
 * First-run adoption: two wobbling eggs. Pick one, it cracks, the baby
 * appears, you name it. The other egg waits at home — nothing is lost.
 */
export function PetAdoption({
  initialSpecies = null,
  onAdopt,
  onCancel
}: {
  initialSpecies?: PetSpecies | null;
  onAdopt: (species: PetSpecies, name: string) => void;
  onCancel?: () => void;
}) {
  const [picked, setPicked] = useState<PetSpecies | null>(initialSpecies);
  const [name, setName] = useState("");

  if (picked) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Pet
          bondTier={1}
          completedCount={1}
          name={name.trim() || DEFAULT_NAME_PLACEHOLDER[picked]}
          species={picked}
          stage="baby"
          totalCount={2}
        />
        <p className="max-w-[240px] text-sm font-bold text-plum">
          {picked === "dog"
            ? "Gâu! Bé cún chui ra rồi! Đặt tên cho bé nha:"
            : "Meo… bé mèo đang chờ một cái tên thật oách:"}
        </p>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onAdopt(picked, name);
          }}
        >
          <label className="sr-only" htmlFor="pet-name">
            Pet name
          </label>
          <input
            autoFocus
            className="h-10 w-36 rounded-full border border-wafer bg-white px-4 text-sm font-semibold text-plum placeholder:text-mauve/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            id="pet-name"
            maxLength={20}
            onChange={(event) => setName(event.target.value)}
            placeholder={DEFAULT_NAME_PLACEHOLDER[picked]}
            value={name}
          />
          <button
            className="squishy rounded-full bg-matcha-deep px-4 py-2.5 text-sm font-bold text-white shadow-mochi transition hover:bg-[#3F6637] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
            type="submit"
          >
            Nhận nuôi 💕
          </button>
        </form>
        {onCancel ? (
          <button
            className="squishy rounded-full px-3 py-1.5 text-xs font-bold text-mauve transition hover:bg-rice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            onClick={onCancel}
            type="button"
          >
            Để sau nhé
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h3 className="font-display text-lg font-bold text-plum">
        Ai sẽ cùng bạn chăm khu vườn?
      </h3>
      <p className="max-w-[260px] text-sm font-semibold text-mauve">
        Chọn một quả trứng nhé — bé còn lại sẽ đợi bạn ở nhà, không đi đâu cả.
      </p>
      <div className="mt-1 flex items-end gap-6">
        {EGG_SPECIES.map((egg) => (
          <button
            aria-label={`Chọn trứng ${egg.title}`}
            className="squishy group flex flex-col items-center gap-1.5 rounded-2xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
            key={egg.species}
            onClick={() => setPicked(egg.species)}
            type="button"
          >
            <svg aria-hidden="true" className="egg-wobble" height="86" viewBox="0 0 76 86" width="76">
              <path
                d="M38 6 C22 6 10 28 10 50 C10 70 22 80 38 80 C54 80 66 70 66 50 C66 28 54 6 38 6 Z"
                fill={BODY}
                stroke={PLUM}
                strokeWidth="3"
              />
              <circle cx="28" cy="34" fill={egg.spot} r="5" />
              <circle cx="46" cy="52" fill={egg.spot} r="6.5" />
              <circle cx="32" cy="62" fill={egg.spot} r="4" />
            </svg>
            <span className="font-display text-sm font-bold text-plum">{egg.title}</span>
            <span className="text-xs font-bold text-mauve">{egg.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
