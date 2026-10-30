/* eslint-disable react/prop-types */
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Plus, Check } from "lucide-react";
import { StatusBadge } from "./workspace/WorkspaceUI";
import { statusInfo } from "../utils/task-status";
export default function UserTaskCard({ user }) {
  const admin = useLocation().pathname === "/users";
  const tasks = user.tasks || user.tasksAssigned || [];
  const completed = tasks.filter(
    (task) => statusInfo(task.status).key === "done",
  ).length;
  const initials = (user.name || user.email || "Team member")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <article className="surface flex h-full flex-col overflow-hidden transition-colors hover:border-input">
      <div className="flex items-center gap-3 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {admin ? (
              <Link className="hover:text-primary" to={`/user/${user.id}`}>
                {user.name || "Team member"}
              </Link>
            ) : (
              user.name || "Team member"
            )}
          </h3>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {user.email}
          </p>
        </div>
        {admin && (
          <Link
            to={`/user/${user.id}`}
            aria-label={`View ${user.name}`}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <ArrowUpRight size={17} />
          </Link>
        )}
      </div>
      <div className="mx-5 border-t border-border py-4">
        <div className="mb-2.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Task progress</span>
          <span className="font-medium">
            {completed}
            <span className="text-muted-foreground">
              {" "}
              / {tasks.length} complete
            </span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <div className="min-h-[104px] flex-1 space-y-3 px-5 pb-5">
        {tasks.length ? (
          tasks.slice(0, 2).map((task) => (
            <div key={task.id} className="flex items-center gap-2.5">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${statusInfo(task.status).key === "done" ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
              >
                {statusInfo(task.status).key === "done" && <Check size={11} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {task.title || task.description || "Untitled task"}
              </span>
              <StatusBadge status={task.status} />
            </div>
          ))
        ) : (
          <p className="rounded-lg bg-background px-3 py-4 text-center text-xs leading-5 text-muted-foreground">
            A clear slate. No tasks assigned yet.
          </p>
        )}
        {tasks.length > 2 && (
          <p className="pl-6 text-[11px] text-muted-foreground">
            +{tasks.length - 2} more tasks
          </p>
        )}
      </div>
      {admin && (
        <Link
          to={`/task/${user.id}`}
          className="flex items-center justify-center gap-2 border-t border-border bg-background/50 px-5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        >
          <Plus size={14} />
          Assign a task
        </Link>
      )}
    </article>
  );
}
