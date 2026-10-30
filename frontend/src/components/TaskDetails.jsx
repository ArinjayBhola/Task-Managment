/* eslint-disable react/prop-types */
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ArrowUpRight, CircleCheck } from "lucide-react";
import { StatusBadge } from "./workspace/WorkspaceUI";
import { statusInfo } from "../utils/task-status";
export default function TaskDetails({ task }) {
  const navigate = useNavigate();
  const location = useLocation();
  const due = task.dueDate || task.due_date;
  const date = due ? new Date(due) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const done = statusInfo(task.status).key === "done";
  const overdue =
    validDate && date < new Date(new Date().setHours(0, 0, 0, 0)) && !done;
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-input sm:items-center">
      <CircleCheck
        size={19}
        strokeWidth={1.5}
        className={`mt-0.5 shrink-0 sm:mt-0 ${done ? "text-primary" : "text-muted-foreground/60"}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-6 ${done ? "text-muted-foreground" : "text-foreground"}`}
        >
          {task.title || task.description || "Untitled task"}
        </p>
        {task.title && task.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
        <span
          className={`mt-2 inline-flex items-center gap-1.5 text-[11px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}
        >
          <CalendarDays size={12} />
          {validDate
            ? `${overdue ? "Overdue · " : ""}${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date)}`
            : "No due date"}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <StatusBadge status={task.status} />
        {location.pathname === "/mytasks" && (
          <button
            aria-label={`Edit ${task.title || task.description || "task"}`}
            onClick={() => navigate(`/user-edittask/${task.id}`)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
