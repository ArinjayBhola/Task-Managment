import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ClipboardList,
  CheckCircle2,
  Clock3,
  Circle,
} from "lucide-react";
import useWorkspaceData from "../../hooks/useWorkspaceData";
import {
  PageHeading,
  LoadError,
  EmptyState,
  StatusBadge,
} from "../../components/workspace/WorkspaceUI";
import HomeShimmer from "../../components/HomeShimmer";
import { Select } from "../../components/ui/Select";
import { statusInfo } from "../../utils/task-status";

export default function TaskAssignments() {
  const { data, loading, error, retry } = useWorkspaceData("/admin/bulk");
  const [status, setStatus] = useState("all");
  const [member, setMember] = useState("all");
  const users = Array.isArray(data) ? data : [];
  const grouped = new Map();
  for (const user of users)
    for (const task of user.tasks || user.tasksAssigned || []) {
      if (!grouped.has(task.id)) grouped.set(task.id, { ...task, members: [] });
      grouped
        .get(task.id)
        .members.push({ id: String(user.id), name: user.name });
    }
  const tasks = [...grouped.values()];
  const filtered = tasks.filter(
    (task) =>
      (status === "all" || statusInfo(task.status).key === status) &&
      (member === "all" || task.members.some((user) => user.id === member)),
  );
  const counts = [
    { label: "Assigned tasks", value: tasks.length, icon: ClipboardList },
    {
      label: "Awaiting start",
      value: tasks.filter((task) => statusInfo(task.status).key === "todo")
        .length,
      icon: Circle,
    },
    {
      label: "In progress",
      value: tasks.filter((task) => statusInfo(task.status).key === "progress")
        .length,
      icon: Clock3,
    },
    {
      label: "Delivered",
      value: tasks.filter((task) => statusInfo(task.status).key === "done")
        .length,
      icon: CheckCircle2,
    },
  ];
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Admin console · Delivery overview"
        title="Task assignments"
        description="Oversee assignments across your team. Filter by member or status to see where work needs attention."
      />
      {loading ? (
        <HomeShimmer />
      ) : error ? (
        <LoadError retry={retry} />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {counts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-3xl font-semibold tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="surface mb-5 grid gap-4 p-4 sm:grid-cols-2">
            <Select
              label="Assignment status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { value: "all", label: "All statuses" },
                { value: "todo", label: "To do" },
                { value: "progress", label: "In progress" },
                { value: "done", label: "Completed" },
              ]}
            />
            <Select
              label="Assigned member"
              value={member}
              onChange={(event) => setMember(event.target.value)}
              options={[
                { value: "all", label: "All members" },
                ...users.map((user) => ({
                  value: String(user.id),
                  label: user.name || user.email,
                })),
              ]}
            />
          </div>
          {filtered.length ? (
            <div className="space-y-3">
              {filtered.map((task) => (
                <Link
                  key={task.id}
                  to={`/admin-edittask/${task.id}`}
                  className="surface flex items-start justify-between gap-4 p-5 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {task.title || task.description || "Untitled task"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Assigned to{" "}
                      {task.members.map((user) => user.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={task.status} />
                    <ArrowUpRight size={15} className="text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No assignments in this view."
              description="Assign tasks from Team management, or choose another member or status."
              action={
                <Link
                  to="/users"
                  className="text-sm font-semibold text-primary"
                >
                  Go to team management →
                </Link>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
