"use client";

import type { ChartData } from "@/types";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ProgressChartProps {
  data: ChartData;
}

export function ProgressChart({ data }: ProgressChartProps) {
  const series = data.series[0];
  const rows = series?.points ?? [];
  return <figure className="chart-card" role="img" aria-label={`${data.title}. ${data.description}`}><figcaption><strong>{data.title}</strong><span>{data.description}</span></figcaption><div className="chart-canvas" aria-hidden="true"><ResponsiveContainer width="100%" height={240}><LineChart data={rows}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="var(--chart-axis)" /><YAxis domain={[0, 1]} tickFormatter={percent} stroke="var(--chart-axis)" /><Tooltip formatter={(value) => percent(Number(value))} contentStyle={{ background: "var(--chart-tooltip)", borderColor: "var(--color-border)", borderRadius: "var(--radius-control)" }} /><Line type="monotone" dataKey="value" name={series?.label} stroke={chartColor(series?.colorToken)} strokeWidth={3} connectNulls={false} /></LineChart></ResponsiveContainer></div><AccessibleValues data={data} /></figure>;
}

export function AccessibleValues({ data }: { data: ChartData }) {
  return <ul className="chart-values">{data.series.flatMap((series) => series.points.map((point) => <li key={`${series.id}-${point.key}`}><span>{point.label}</span><strong>{point.value === null ? "No data" : percent(point.value)}</strong></li>))}</ul>;
}

export function percent(value: number) { return `${Math.round(value * 100)}%`; }
export function chartColor(token = "chart-series-1") { const map: Record<string, string> = { "status-good": "status-good-text", "status-okay": "status-okay-text", "status-bad": "status-bad-text", "status-planned": "status-planned-text" }; return `var(--${map[token] ?? token})`; }
