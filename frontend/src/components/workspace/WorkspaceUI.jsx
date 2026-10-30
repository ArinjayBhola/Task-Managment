/* eslint-disable react/prop-types */
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ListTodo,
  Users,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/Button";
import { statusInfo } from "../../utils/task-status";
export function StatusBadge({ status }) {
  const info = statusInfo(status);
  const Icon = info.icon;
  return (
    <span className={`status-pill ${info.color}`}>
      <Icon size={11} />
      {info.label}
    </span>
  );
}
export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow mb-2.5">{eyebrow}</p>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-1.1px] sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-xl text-[13px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
export function Metrics({ users, tasks, personal = false }) {
  const done = tasks.filter((t) => statusInfo(t.status).key === "done").length;
  const progress = tasks.filter(
    (t) => statusInfo(t.status).key === "progress",
  ).length;
  const items = [
    {
      label: personal ? "Total tasks" : "Team members",
      value: personal ? tasks.length : users.length,
      icon: personal ? ListTodo : Users,
      note: personal ? "Everything on your list" : "People in your workspace",
      color: "text-primary bg-accent",
    },
    {
      label: "In progress",
      value: progress,
      icon: Clock3,
      note: "Moving things forward",
      color: "text-amber-700 dark:text-amber-300 bg-amber-500/10",
    },
    {
      label: "Completed",
      value: done,
      icon: CheckCircle2,
      note: "One less thing to think about",
      color: "text-primary bg-accent",
    },
    {
      label: "Completion rate",
      value: `${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%`,
      icon: ArrowUpRight,
      note: tasks.length
        ? `${done} of ${tasks.length} tasks complete`
        : "A fresh start for your team",
      color: "text-muted-foreground bg-muted",
    },
  ];
  return (
    <div className="mb-9 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon, note, color }) => (
        <div key={label} className="surface p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}
            >
              <Icon size={14} />
            </span>
          </div>
          <div className="text-[30px] font-semibold leading-none tracking-[-1px] tabular-nums">
            {value}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            {note}
          </p>
        </div>
      ))}
    </div>
  );
}
export function EmptyState({
  title = "A little space for what’s next.",
  description = "Nothing here yet. Your next task will feel right at home.",
  action,
  icon: Icon = ListTodo,
}) {
  return (
    <div className="surface flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-primary">
        <Icon size={23} />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export function LoadError({
  retry,
  message = "We couldn’t load this workspace.",
}) {
  return (
    <div
      role="alert"
      className="surface flex flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <AlertCircle className="text-destructive" size={25} />
      <h2 className="text-sm font-semibold">{message}</h2>
      <p className="max-w-md text-xs leading-6 text-muted-foreground">
        Your work is safe. Check your connection and try again.
      </p>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw size={13} />
          Try again
        </Button>
      )}
    </div>
  );
}
export function Notice({ children, success = false }) {
  return (
    <p
      role={success ? "status" : "alert"}
      className={`rounded-lg border px-4 py-3 text-xs leading-5 ${success ? "border-primary/20 bg-accent text-primary" : "border-destructive/20 bg-destructive/10 text-destructive"}`}
    >
      {children}
    </p>
  );
}
