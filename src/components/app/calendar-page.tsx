"use client";

import { useAppState } from "@/components/app/state-provider";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { CalendarPanel } from "@/components/dashboard/calendar-panel";
import { EventsCard } from "@/components/dashboard/events-card";

/** 📅 Lịch & nhịp — the month, what's coming, and the numbers (spec §8). */
export function CalendarPage() {
  const app = useAppState();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
      <CalendarPanel days={app.viewModel.calendar.days} viewModel={app.viewModel} />
      <EventsCard
        events={app.viewModel.events}
        onAdd={app.addEvent}
        onRemove={app.removeEvent}
        today={app.today}
      />
      <div className="xl:col-span-2">
        <AnalyticsPanel viewModel={app.viewModel} />
      </div>
    </div>
  );
}
