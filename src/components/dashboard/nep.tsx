"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Nếp — the BetterMe companion. A sticky-rice blob ("nếp" is both glutinous
 * rice and the root of "nề nếp": routine). The sprout on his head is the
 * daily progress meter: asleep at 0, one leaf, two leaves, a bud, and a
 * sakura flower that blooms at 100%. Pure SVG + CSS, no assets.
 */

const PLUM = "#4A3D46";
const MAUVE = "#6F6069";
const RICE_BODY = "#FFFDF8";
const MATCHA = "#7FB069";
const MATCHA_DEEP = "#4C7A43";
const SAKURA = "#F6C6CE";
const BUTTER = "#FFD98E";

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

type NepStage = "asleep" | "waking" | "happy" | "delighted" | "blooming";

function getNepStage(completedCount: number, totalCount: number): NepStage {
  if (totalCount <= 0 || completedCount <= 0) return "asleep";

  const rate = completedCount / totalCount;

  if (rate >= 1) return "blooming";
  if (rate > 0.67) return "delighted";
  if (rate > 0.34) return "happy";
  return "waking";
}

const STAGE_LABEL: Record<NepStage, string> = {
  asleep: "fast asleep, waiting for the first habit",
  waking: "waking up, sprout peeking out",
  happy: "happy, sprout growing",
  delighted: "delighted, a bud is forming",
  blooming: "celebrating, the sakura flower is blooming"
};

export function Nep({
  celebrate = false,
  completedCount,
  totalCount,
  message
}: {
  celebrate?: boolean;
  completedCount: number;
  totalCount: number;
  message: string;
}) {
  const stage = getNepStage(completedCount, totalCount);
  const [squash, setSquash] = useState(false);
  const previousCount = useRef(completedCount);

  useEffect(() => {
    if (completedCount === previousCount.current) return;

    previousCount.current = completedCount;
    setSquash(true);
    const squashTimer = window.setTimeout(() => setSquash(false), 450);

    return () => {
      window.clearTimeout(squashTimer);
    };
  }, [completedCount]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="bubble-in relative max-w-[240px] rounded-2xl border border-wafer bg-mochi px-4 py-2.5 text-center text-sm font-semibold leading-5 text-plum shadow-mochi"
        key={message}
      >
        {message}
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-wafer bg-mochi"
        />
      </div>

      <div className="relative">
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

        <svg
          aria-label={`Nếp the companion, ${STAGE_LABEL[stage]}`}
          className={cn(
            squash ? "nep-squash" : stage !== "asleep" ? "nep-idle" : undefined
          )}
          height="120"
          role="img"
          viewBox="0 0 140 120"
          width="140"
        >
          {/* ground shadow */}
          <ellipse cx="70" cy="112" fill={PLUM} opacity="0.07" rx="36" ry="5" />

          {/* sprout — the daily progress meter */}
          {stage === "asleep" ? (
            <g>
              <path
                d="M70 30 Q70 25 70 23"
                fill="none"
                stroke={MATCHA_DEEP}
                strokeLinecap="round"
                strokeWidth="3"
              />
              <circle cx="70" cy="21" fill={MATCHA} r="2.5" />
            </g>
          ) : (
            <g>
              <path
                d="M70 30 C70 22 69 17 70 10"
                fill="none"
                stroke={MATCHA_DEEP}
                strokeLinecap="round"
                strokeWidth="3"
              />
              <path
                d="M69 18 C61 18 56 12 58 4 C65 4 69 10 69 18 Z"
                fill={MATCHA}
              />
              {stage !== "waking" ? (
                <path
                  d="M71 22 C79 22 84 16 82 8 C75 8 71 14 71 22 Z"
                  fill={MATCHA}
                />
              ) : null}
              {stage === "delighted" ? (
                <circle cx="70" cy="8" fill={SAKURA} r="4.5" />
              ) : null}
              {stage === "blooming" ? (
                <g className="nep-bloom">
                  <circle cx="70" cy="1" fill={SAKURA} r="4.5" />
                  <circle cx="76.5" cy="5.5" fill={SAKURA} r="4.5" />
                  <circle cx="74" cy="13" fill={SAKURA} r="4.5" />
                  <circle cx="66" cy="13" fill={SAKURA} r="4.5" />
                  <circle cx="63.5" cy="5.5" fill={SAKURA} r="4.5" />
                  <circle cx="70" cy="7.5" fill={BUTTER} r="3.6" />
                </g>
              ) : null}
            </g>
          )}

          {/* body */}
          <path
            d={
              stage === "asleep"
                ? "M70 36 C40 36 26 52 26 76 C26 100 44 110 70 110 C96 110 114 100 114 76 C114 52 100 36 70 36 Z"
                : "M70 30 C40 30 26 48 26 74 C26 100 44 110 70 110 C96 110 114 100 114 74 C114 48 100 30 70 30 Z"
            }
            fill={RICE_BODY}
            stroke={PLUM}
            strokeWidth="3"
          />

          {/* blush */}
          <ellipse
            cx="44"
            cy="82"
            fill={SAKURA}
            opacity={stage === "delighted" || stage === "blooming" ? 0.8 : 0.5}
            rx="7"
            ry="4"
          />
          <ellipse
            cx="96"
            cy="82"
            fill={SAKURA}
            opacity={stage === "delighted" || stage === "blooming" ? 0.8 : 0.5}
            rx="7"
            ry="4"
          />

          {/* eyes */}
          {stage === "asleep" ? (
            <g fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="3">
              <path d="M46 70 Q52 74 58 70" />
              <path d="M82 70 Q88 74 94 70" />
            </g>
          ) : stage === "blooming" ? (
            <g fill="none" stroke={PLUM} strokeLinecap="round" strokeWidth="3.5">
              <path d="M46 71 Q52 63 58 71" />
              <path d="M82 71 Q88 63 94 71" />
            </g>
          ) : (
            <g>
              <circle cx="52" cy="69" fill={PLUM} r="4.5" />
              <circle cx="88" cy="69" fill={PLUM} r="4.5" />
              <circle cx="53.6" cy="67.4" fill="#FFFFFF" r="1.5" />
              <circle cx="89.6" cy="67.4" fill="#FFFFFF" r="1.5" />
            </g>
          )}

          {/* mouth */}
          {stage === "asleep" ? (
            <circle cx="70" cy="87" fill="none" r="2.5" stroke={PLUM} strokeWidth="2.5" />
          ) : stage === "waking" ? (
            <path
              d="M64 85 Q70 90 76 85"
              fill="none"
              stroke={PLUM}
              strokeLinecap="round"
              strokeWidth="3"
            />
          ) : stage === "happy" ? (
            <path
              d="M62 84 Q70 92 78 84"
              fill="none"
              stroke={PLUM}
              strokeLinecap="round"
              strokeWidth="3"
            />
          ) : (
            <path d="M61 83 Q70 96 79 83 Z" fill={PLUM} />
          )}

          {/* zzz while asleep */}
          {stage === "asleep" ? (
            <g
              fill={MAUVE}
              fontFamily="var(--font-display), 'Baloo 2', sans-serif"
              fontWeight="700"
            >
              <text className="nep-zzz" fontSize="11" x="102" y="48">
                z
              </text>
              <text
                className="nep-zzz"
                fontSize="14"
                style={{ animationDelay: "1.3s" }}
                x="110"
                y="36"
              >
                z
              </text>
              <text
                className="nep-zzz"
                fontSize="17"
                style={{ animationDelay: "2.6s" }}
                x="119"
                y="24"
              >
                z
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
