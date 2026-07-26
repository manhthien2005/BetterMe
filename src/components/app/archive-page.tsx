"use client";

import { useState } from "react";

import { useAppState } from "@/components/app/state-provider";
import { HABIT_COLOR_STYLES } from "@/components/dashboard/habit-model";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * 🗃 Lưu trữ — the only place a habit can be deleted for good (spec §5.1,
 * destructive isolation). Everything here keeps its full history until the
 * moment it is deleted, and deleting takes two deliberate presses.
 */
export function ArchivePage() {
  const app = useAppState();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const archived = app.allHabits.filter((habit) => habit.archivedAt !== null);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-extrabold text-ink">Lưu trữ</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Những thói quen bạn đã cất đi. Lịch sử của chúng vẫn còn nguyên — đưa trở lại lúc nào
          cũng được.
        </p>
      </div>

      {archived.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-ink-soft">
            Chưa có gì ở đây cả. Khi một thói quen không còn hợp với nhịp sống, bạn có thể cất nó
            vào đây thay vì xoá đi.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {archived.map((habit) => (
            <li key={habit.id}>
              <Card className="flex flex-wrap items-center gap-3 p-3 sm:p-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-xl",
                    HABIT_COLOR_STYLES[habit.color].soft
                  )}
                >
                  {habit.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {habit.name}
                  </span>
                  <span className="text-[11px] text-ink-soft">{`Cất từ ${habit.archivedAt}`}</span>
                </span>

                {confirmingId === habit.id ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-ink-mid">Xoá hẳn?</span>
                    <Button
                      onClick={() => {
                        app.deleteHabitForever(habit.id);
                        setConfirmingId(null);
                      }}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      Xoá vĩnh viễn
                    </Button>
                    <Button
                      onClick={() => setConfirmingId(null)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Thôi
                    </Button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Button
                      onClick={() => app.archiveHabit(habit.id, false)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Đưa trở lại
                    </Button>
                    <Button
                      aria-label={`Xoá vĩnh viễn ${habit.name}`}
                      onClick={() => setConfirmingId(habit.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Xoá hẳn
                    </Button>
                  </span>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
