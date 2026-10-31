import { useState } from "react";
import { Search, ListTodo } from "lucide-react";
import useWorkspaceData from "../../hooks/useWorkspaceData";
import TaskDetails from "../../components/TaskDetails";
import HomeShimmer from "../../components/HomeShimmer";
import { Input } from "../../components/ui/Input";
import {
  PageHeading,
  Metrics,
  EmptyState,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
import { statusInfo } from "../../utils/task-status";
export default function MyTask() {
  const { data, loading, error, retry } = useWorkspaceData("/user/bulk");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const users = Array.isArray(data) ? data : [];
  const tasks = users.flatMap((user) => user.tasks || user.tasksAssigned || []);
  const filtered = tasks.filter(
    (task) =>
      (filter === "all" || statusInfo(task.status).key === filter) &&
      `${task.title || ""} ${task.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Member dashboard · My work"
        title="My tasks"
        description="Your assignments, your progress, your next step. Focus on the work that’s yours."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Personal task view
          </span>
        }
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <HomeShimmer />
          <HomeShimmer />
        </div>
      ) : error ? (
        <LoadError retry={retry} />
      ) : (
        <>
          <Metrics users={users} tasks={tasks} personal />
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">Your task list</h2>
              <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                {tasks.length} tasks
              </span>
            </div>
            <div className="relative sm:w-64">
              <Input
                label="Search your tasks"
                startAdornment={<Search size={14} />}
                placeholder="Find a task…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border pb-3">
            {[
              ["all", "All tasks"],
              ["todo", "To do"],
              ["progress", "In progress"],
              ["done", "Completed"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${filter === key ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {label}{" "}
                <span className="ml-2 opacity-60">
                  {key === "all"
                    ? tasks.length
                    : tasks.filter(
                        (task) => statusInfo(task.status).key === key,
                      ).length}
                </span>
              </button>
            ))}
          </div>
          {filtered.length ? (
            <div className="space-y-3">
              {filtered.map((task) => (
                <TaskDetails key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListTodo}
              title={
                tasks.length
                  ? "A clear view."
                  : "Your next chapter starts here."
              }
              description={
                tasks.length
                  ? "No tasks match this view. Try another filter or search."
                  : "When your administrator assigns a task, it will appear here. You’re all set for what’s next."
              }
            />
          )}
        </>
      )}
    </div>
  );
}
