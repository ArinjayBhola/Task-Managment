import { CheckCircle2, Circle, Clock3 } from "lucide-react";
export function statusInfo(status = "") {
  const normalized = status.toLowerCase().replaceAll("_", "-");
  if (["completed", "done"].includes(normalized))
    return {
      label: "Completed",
      key: "done",
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  if (["in progress", "in-progress"].includes(normalized))
    return {
      label: "In progress",
      key: "progress",
      icon: Clock3,
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  if (["canceled", "cancelled"].includes(normalized))
    return {
      label: "Canceled",
      key: "canceled",
      icon: Circle,
      color: "bg-muted text-muted-foreground",
    };
  return {
    label: "To do",
    key: "todo",
    icon: Circle,
    color: "bg-muted text-muted-foreground",
  };
}
