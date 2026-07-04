import { Badge } from "@/components/ui/badge";
import type { TrackerStatus } from "@/lib/types";

const labels: Record<TrackerStatus, string> = {
  Good: "Good",
  Okay: "Okay",
  Bad: "Bad",
  Planned: "Planned",
  "": "Chưa có"
};

export function StatusBadge({ status }: { status: TrackerStatus }) {
  if (status === "Good") return <Badge variant="success">{labels[status]}</Badge>;
  if (status === "Okay") return <Badge variant="warning">{labels[status]}</Badge>;
  if (status === "Bad") return <Badge variant="danger">{labels[status]}</Badge>;
  if (status === "Planned") return <Badge variant="secondary">{labels[status]}</Badge>;

  return <Badge variant="outline">{labels[status]}</Badge>;
}
