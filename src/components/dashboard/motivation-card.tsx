import type { MotivationMessage } from "@/types";

export function MotivationCard({ message }: { message: MotivationMessage }) {
  return (
    <aside aria-label="Motivation" className="motivation-card">
      <p>{message.body}</p>
    </aside>
  );
}
