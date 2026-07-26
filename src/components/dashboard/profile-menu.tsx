"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ProfileMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: "default" | "danger";
};

/**
 * The account button in the header: an avatar that opens a small accessible
 * menu (Hồ sơ / Cài đặt / Đăng xuất). Dependency-free so it stays trivially
 * testable in jsdom — but it still behaves like a real menu:
 *   • aria-haspopup / aria-expanded on the trigger, role="menu" + menuitems
 *   • opens with click / Enter / Space / ArrowUp / ArrowDown
 *   • roving focus with ArrowUp/ArrowDown/Home/End
 *   • Escape or an outside click closes it and returns focus to the trigger
 */
export function ProfileMenu({
  email,
  onSignOut,
  onOpenProfile,
  onOpenSettings
}: {
  email: string;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const triggerId = useId();

  const items: ProfileMenuItem[] = [
    { key: "profile", label: "Hồ sơ", icon: User, onSelect: onOpenProfile },
    { key: "settings", label: "Cài đặt", icon: Settings, onSelect: onOpenSettings },
    { key: "signout", label: "Đăng xuất", icon: LogOut, onSelect: onSignOut, tone: "danger" }
  ];

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setOpen(true);
  }, []);

  // Focus the active item whenever the menu is open (and on arrow navigation).
  useEffect(() => {
    if (!open) return;

    itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  // Close on any click/tap outside the whole control.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAt(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(items.length - 1);
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        // Let focus leave naturally, but collapse the menu.
        setOpen(false);
        break;
      default:
        break;
    }
  }

  function selectItem(item: ProfileMenuItem) {
    // Close first (returns focus to the trigger), then run the action so a
    // navigation like sign-out is the last thing that happens.
    close();
    item.onSelect();
  }

  const initials = avatarInitials(email);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className="squishy flex items-center gap-2 rounded-full border border-wafer bg-mochi p-1 pr-2.5 shadow-mochi transition hover:bg-rice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2"
        id={triggerId}
        onClick={() => (open ? close(false) : openAt(0))}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-matcha to-matcha-deep font-display text-sm font-bold text-white shadow-sm"
        >
          {initials}
        </span>
        <span className="hidden max-w-[160px] flex-col text-left leading-tight sm:flex">
          <span className="truncate text-xs font-bold text-plum">{accountName(email)}</span>
          <span className="truncate text-[10px] font-semibold text-mauve">{email}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 text-mauve transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        <span className="sr-only">Tài khoản {email}</span>
      </button>

      {open ? (
        <div
          aria-labelledby={triggerId}
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-wafer bg-mochi p-1.5 shadow-mochi-lift"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-rice/70 px-3 py-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-matcha to-matcha-deep font-display text-sm font-bold text-white"
            >
              {initials}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold text-plum">{accountName(email)}</span>
              <span className="truncate text-xs font-semibold text-mauve">{email}</span>
            </span>
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5">
            {items.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  className={cn(
                    "squishy flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep",
                    item.tone === "danger"
                      ? "text-sakura-deep hover:bg-sakura/20"
                      : "text-plum hover:bg-rice"
                  )}
                  key={item.key}
                  onClick={() => selectItem(item)}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  role="menuitem"
                  tabIndex={index === activeIndex ? 0 : -1}
                  type="button"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Two-letter avatar initials from the email's local part (falls back to "BM"). */
function avatarInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();

  return "BM";
}

/** A friendly display name derived from the email's local part. */
function accountName(email: string): string {
  const local = email.split("@")[0] ?? "";

  if (!local) return "BetterMe";

  const first = local.split(/[._-]+/).filter(Boolean)[0] ?? local;

  return first.charAt(0).toUpperCase() + first.slice(1);
}
