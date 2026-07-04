import type { ScoreSummary } from "@/types";

export function formatScoreSummary(summary: ScoreSummary): string {
  if (summary.completionRate === null) return `${summary.totalScore}/${summary.maxScore}`;
  return `${summary.totalScore}/${summary.maxScore} · ${Math.round(summary.completionRate * 100)}%`;
}
