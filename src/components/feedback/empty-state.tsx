import type { ReactNode } from "react";

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="empty-state" aria-label={title}><div aria-hidden="true" className="empty-state__mark">✦</div><h2>{title}</h2><div>{children}</div>{action}</section>;
}
