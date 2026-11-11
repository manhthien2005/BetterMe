"use client";

import {
  ArrowLeft,
  Check,
  Compass,
  DoorOpen,
  Home,
  MessageCircle,
  RotateCcw,
  Sparkles,
  UserCheck
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { CharacterAvatarStatus } from "@/components/world/character-avatar";
import { WorldEnvironmentHud } from "@/components/world/world-environment-hud";
import { WorldPerformanceHud } from "@/components/world/world-performance-hud";
import {
  ANIMATION_STATE_LABELS,
  type CharacterAnimationStateId
} from "@/lib/world/animation-state-machine";
import type {
  EffectiveEnvironmentSnapshot,
  EnvironmentPresetId,
  EnvironmentPreviewOverride
} from "@/lib/world/environment-model";
import type {
  DialogueSession,
  NpcDefinition,
  PersonalWorldOwnerState,
  WorldPortalDefinition,
  WorldSpaceId,
  ZoneDefinition,
  ZoneId
} from "@/lib/world/types";
import { cn } from "@/lib/utils";

const PUBLIC_ZONE_ITEMS: readonly {
  id: ZoneId;
  shortLabel: string;
  direction: string;
}[] = [{ id: "plaza", shortLabel: "Quảng trường Chung", direction: "Trung tâm" }];

const PERSONAL_ZONE_ITEMS: readonly {
  id: ZoneId;
  shortLabel: string;
  direction: string;
}[] = [
  { id: "personal_home", shortLabel: "Nhà riêng", direction: "Tây (A)" },
  { id: "personal_garden", shortLabel: "Khu vườn", direction: "Đông (D)" },
  { id: "personal_library", shortLabel: "Thư viện", direction: "Bắc (W)" }
];

const AVATAR_STATUS_LABELS: Readonly<Record<CharacterAvatarStatus, string>> = {
  loading: "Đang tải VRM...",
  ready: "VRM 1.0 Anime",
  fallback: "Avatar dự phòng"
};

export function WorldHud({
  activeSpaceId,
  spaceTitle,
  ownerState,
  activeZone,
  visitedZones,
  nearbyNpc,
  nearbyPortal,
  dialogueSession,
  allNpcs,
  animationState = "idle",
  avatarStatus = "ready",
  environment,
  previewOverride = null,
  onEnablePreview,
  onUpdatePreview,
  onApplyPreset,
  onExitPreview,
  onInteract,
  onUsePortal,
  onSwitchSpace,
  onResetCamera,
  onCloseDialogue
}: {
  activeSpaceId: WorldSpaceId;
  spaceTitle: string;
  ownerState: PersonalWorldOwnerState;
  activeZone: ZoneDefinition;
  visitedZones: ReadonlySet<ZoneId>;
  nearbyNpc: NpcDefinition | null;
  nearbyPortal: WorldPortalDefinition | null;
  dialogueSession: DialogueSession | null;
  allNpcs: readonly NpcDefinition[];
  animationState?: CharacterAnimationStateId;
  avatarStatus?: CharacterAvatarStatus;
  environment?: EffectiveEnvironmentSnapshot;
  previewOverride?: EnvironmentPreviewOverride | null;
  onEnablePreview?: () => void;
  onUpdatePreview?: (patch: Partial<EnvironmentPreviewOverride>) => void;
  onApplyPreset?: (presetId: EnvironmentPresetId) => void;
  onExitPreview?: () => void;
  onInteract: () => void;
  onUsePortal: (portal: WorldPortalDefinition) => void;
  onSwitchSpace: (targetSpaceId: WorldSpaceId) => void;
  onResetCamera: () => void;
  onCloseDialogue: () => void;
}) {
  const dialogueNpc = dialogueSession
    ? (allNpcs.find((npc) => npc.id === dialogueSession.npcId) ?? null)
    : null;
  const currentLine =
    dialogueNpc && dialogueSession
      ? (dialogueNpc.dialogue[dialogueSession.lineIndex] ?? null)
      : null;
  const isLastLine =
    dialogueNpc && dialogueSession
      ? dialogueSession.lineIndex >= dialogueNpc.dialogue.length - 1
      : false;

  const zoneChecklist =
    activeSpaceId === "public_plaza" ? PUBLIC_ZONE_ITEMS : PERSONAL_ZONE_ITEMS;
  const alternateSpaceId: WorldSpaceId =
    activeSpaceId === "public_plaza" ? "personal_world" : "public_plaza";
  const alternateSpaceLabel =
    activeSpaceId === "public_plaza"
      ? "Vào Không gian Cá nhân"
      : "Về Quảng trường Chung";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-6">
      {/* Top Bar: Navigation back to BetterMe + Space Switcher + Character Telemetry + Environment V1 + Current Zone Orientation */}
      <header className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div
            className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2.5"
            data-world-hud="true"
          >
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard">
                <Icon as={ArrowLeft} size="sm" />
                Về BetterMe
              </Link>
            </Button>

            <div className="rounded-card border border-line-strong bg-surface-card px-2.5 py-1.5 shadow-card sm:px-3.5 sm:py-2">
              <div className="flex items-center gap-2">
                <p className="font-display text-xs font-bold leading-tight text-ink sm:text-sm">
                  Reading Quest <span className="text-[11px] font-semibold text-ink-soft sm:text-xs">v0.3-B</span>
                </p>
                <span className="rounded-pill border border-line bg-surface-warm px-2 py-0.5 text-[10px] font-bold text-ink-mid">
                  {activeSpaceId === "public_plaza" ? "Public Plaza" : "Personal World"}
                </span>
              </div>
              <p className="text-[10px] font-medium text-ink-soft sm:text-[11px]">
                {activeSpaceId === "personal_world"
                  ? `Chủ sở hữu: ${ownerState.ownerEmail}`
                  : `Học viên: ${ownerState.ownerEmail}`}
              </p>
            </div>

            <div
              aria-label="Trạng thái nhân vật 3D"
              className="flex items-center gap-1.5 rounded-card border border-line-strong bg-surface-card px-2.5 py-1.5 text-xs font-semibold text-ink shadow-card sm:gap-2 sm:px-3 sm:py-2"
              data-animation-state={animationState}
              data-avatar-status={avatarStatus}
              data-testid="character-animation-badge"
            >
              <Icon as={UserCheck} className="text-action" size="sm" />
              <div className="leading-tight">
                <p className="text-[11px] font-bold text-ink">
                  {ANIMATION_STATE_LABELS[animationState]}
                </p>
                <p className="text-[10px] font-medium text-ink-soft">
                  {AVATAR_STATUS_LABELS[avatarStatus]}
                </p>
              </div>
            </div>

            <WorldPerformanceHud />

            <Button
              onClick={() => onSwitchSpace(alternateSpaceId)}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Icon as={activeSpaceId === "public_plaza" ? Home : Sparkles} size="sm" />
              {alternateSpaceLabel}
            </Button>

            <Button
              aria-label="Đặt lại góc nhìn (R)"
              className="hidden sm:inline-flex"
              onClick={onResetCamera}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Icon as={RotateCcw} size="sm" />
              Đặt lại camera (R)
            </Button>
          </div>

          {environment && onEnablePreview && onUpdatePreview && onApplyPreset && onExitPreview ? (
            <WorldEnvironmentHud
              environment={environment}
              onApplyPreset={onApplyPreset}
              onEnablePreview={onEnablePreview}
              onExitPreview={onExitPreview}
              onUpdatePreview={onUpdatePreview}
              previewOverride={previewOverride}
            />
          ) : null}
        </div>

        {/* Zone Indicator + Space Checklist */}
        <section
          aria-label="Khu vực hiện tại"
          aria-live="polite"
          className="pointer-events-auto w-full max-w-xs rounded-card border border-line-strong bg-surface-card p-2.5 shadow-card sm:w-auto sm:min-w-[290px] sm:p-3.5"
          data-world-hud="true"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon as={Compass} className="text-action" size="sm" />
              <h1 className="font-display text-sm font-extrabold leading-tight text-ink sm:text-base">
                {activeZone.title}
              </h1>
            </div>
            <span className="rounded-pill border border-line bg-surface-page px-2 py-0.5 text-[10px] font-bold text-ink-soft">
              {spaceTitle}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-ink-mid sm:text-xs">{activeZone.subtitle}</p>
          <p className="mt-1 hidden text-xs leading-snug text-ink-soft sm:block">{activeZone.description}</p>

          <ul
            aria-label={
              activeSpaceId === "public_plaza"
                ? "Khu vực Quảng trường Chung"
                : "Ba khu vực Không gian Cá nhân"
            }
            className={cn(
              "mt-1.5 grid gap-1 sm:mt-2.5 sm:gap-1.5",
              zoneChecklist.length === 1 ? "grid-cols-1" : "grid-cols-3"
            )}
          >
            {zoneChecklist.map((item) => {
              const isCurrent = activeZone.id === item.id;
              const isVisited = visitedZones.has(item.id);

              return (
                <li
                  className={cn(
                    "flex items-center justify-between gap-1 rounded-control border px-2 py-1 text-[11px] font-semibold",
                    isCurrent
                      ? "border-line-control bg-surface-warm text-ink"
                      : isVisited
                        ? "border-line-success bg-surface-success text-success-ink"
                        : "border-line bg-surface-page text-ink-soft"
                  )}
                  key={item.id}
                >
                  <span className="truncate">{item.shortLabel}</span>
                  {isVisited ? (
                    <Icon as={Check} className="shrink-0 text-success-ink" size="sm" />
                  ) : (
                    <span className="shrink-0 text-[10px] text-ink-soft">{item.direction}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </header>

      {/* Bottom Area: Dialogue / Portal / NPC Prompt + Controls Legend */}
      <div className="flex flex-col items-center gap-3">
        {dialogueNpc && dialogueSession && currentLine ? (
          <section
            aria-label={`Hội thoại cùng ${dialogueNpc.name}`}
            className="pointer-events-auto w-full max-w-xl rounded-card border border-line-strong bg-surface-card p-4 shadow-card sm:p-5"
            data-world-hud="true"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold text-ink">
                  {dialogueNpc.name}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">{dialogueNpc.role}</p>
              </div>
              <span className="rounded-pill border border-line bg-surface-warm px-2.5 py-0.5 text-xs font-bold text-ink-mid">
                {dialogueSession.lineIndex + 1} / {dialogueNpc.dialogue.length}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink sm:text-[15px]">
              {currentLine}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button onClick={onCloseDialogue} size="sm" type="button" variant="ghost">
                Đóng (Esc)
              </Button>
              <Button onClick={onInteract} size="sm" type="button" variant="primary">
                {isLastLine ? "Hoàn tất (E)" : "Tiếp theo (E)"}
              </Button>
            </div>
          </section>
        ) : nearbyPortal ? (
          <div
            aria-live="polite"
            className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-pill border border-line-strong bg-surface-card p-1.5 pl-3.5 shadow-card"
            data-world-hud="true"
            role="status"
          >
            <Icon as={DoorOpen} className="text-action" size="sm" />
            <span className="text-xs font-semibold text-ink sm:text-sm">
              Gần <strong>{nearbyPortal.title}</strong> ({nearbyPortal.subtitle})
            </span>
            <Button
              onClick={() => onUsePortal(nearbyPortal)}
              size="sm"
              type="button"
              variant="primary"
            >
              {nearbyPortal.actionLabel}
            </Button>
          </div>
        ) : nearbyNpc ? (
          <div
            aria-live="polite"
            className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-pill border border-line-strong bg-surface-card p-1.5 pl-3.5 shadow-card"
            data-world-hud="true"
            role="status"
          >
            <Icon as={MessageCircle} className="text-action" size="sm" />
            <span className="rounded-pill border border-line bg-surface-warm px-2 py-0.5 text-[11px] font-bold text-ink">
              E — Tương tác
            </span>
            <span className="text-xs font-semibold text-ink sm:text-sm">
              Gần <strong>{nearbyNpc.name}</strong>
            </span>
            <Button onClick={onInteract} size="sm" type="button" variant="primary">
              Trò chuyện (E)
            </Button>
          </div>
        ) : null}

        {/* Persistent Controls Bar */}
        <footer
          aria-label="Hướng dẫn điều khiển"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 rounded-pill border border-line-strong bg-surface-card px-4 py-2 text-xs font-semibold text-ink-mid shadow-card"
          data-world-hud="true"
        >
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              WASD
            </kbd>{" "}
            Di chuyển
          </span>
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              Shift
            </kbd>{" "}
            Chạy
          </span>
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              Space
            </kbd>{" "}
            Nhảy
          </span>
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              Chuột phải + Kéo
            </kbd>{" "}
            Xoay góc nhìn
          </span>
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              Con lăn
            </kbd>{" "}
            Thu/phóng
          </span>
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              R
            </kbd>{" "}
            Đặt lại camera
          </span>
          <span>
            <kbd className="rounded border border-line-strong bg-surface-page px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
              E
            </kbd>{" "}
            Tương tác / Cổng
          </span>
        </footer>
      </div>
    </div>
  );
}
