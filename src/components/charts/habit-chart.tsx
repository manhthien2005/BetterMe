"use client";

import type { ChartData } from "@/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AccessibleValues, chartColor, percent } from "./progress-chart";

export function HabitChart({ data }: { data: ChartData }) {
  const series = data.series[0];
  const rows = series?.points ?? [];
  return <figure className="chart-card" role="img" aria-label={`${data.title}. ${data.description}`}><figcaption><strong>{data.title}</strong><span>{data.description}</span></figcaption><div className="chart-canvas" aria-hidden="true"><ResponsiveContainer width="100%" height={240}><BarChart data={rows}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="var(--chart-axis)" /><YAxis domain={[0, 1]} tickFormatter={percent} stroke="var(--chart-axis)" /><Tooltip formatter={(value) => percent(Number(value))} contentStyle={{ background: "var(--chart-tooltip)", borderColor: "var(--color-border)", borderRadius: "var(--radius-control)" }} /><Bar dataKey="value" name={series?.label} fill={chartColor(series?.colorToken)} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div><AccessibleValues data={data} /></figure>;
}
