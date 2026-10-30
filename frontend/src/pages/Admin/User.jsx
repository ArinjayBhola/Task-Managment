import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid2X2, List, Plus, Search, Users, X } from "lucide-react";
import CreateUserCard from "../../components/CreateUserCard";
import UserTaskCard from "../../components/UserTaskCard";
import HomeShimmer from "../../components/HomeShimmer";
import { toggleCreateUser } from "../../redux/slice/createUserSlice";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PageHeading,
  Metrics,
  EmptyState,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
import { statusInfo } from "../../utils/task-status";
import useWorkspaceData from "../../hooks/useWorkspaceData";

export default function User() {
  const { data, loading, error, retry } = useWorkspaceData("/admin/bulk");
  const users = Array.isArray(data) ? data : [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const showCreate = useSelector((state) => state.createUser);
  const dispatch = useDispatch();
  const tasks = [
    ...new Map(
      users
        .flatMap((user) => user.tasks || user.tasksAssigned || [])
        .map((task) => [task.id, task]),
    ).values(),
  ];
  const filtered = users.filter(
    (user) =>
      `${user.name} ${user.email}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (user.tasks || []).some(
          (task) => !["done", "canceled"].includes(statusInfo(task.status).key),
        )),
  );
  const createButton = (
    <Button onClick={() => dispatch(toggleCreateUser())}>
      <Plus size={16} />
      New team member
    </Button>
  );
  return (
    <div className="page-wrap">
      {showCreate && <CreateUserCard />}
      <PageHeading
        eyebrow="Admin console · People & access"
        title="Team management"
        description="Create member accounts, assign work, and oversee delivery across your team."
        action={createButton}
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
          <Metrics users={users} tasks={tasks} />
          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold tracking-tight">
                  Team directory
                </h2>
                <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                  {users.length} members
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                <button
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  className={`rounded-md p-1.5 ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <Grid2X2 size={15} />
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={`rounded-md p-1.5 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
            <div className="mb-5 flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1">
                {[
                  ["all", "All members"],
                  ["active", "With active tasks"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-pressed={filter === key}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Input
                  label="Search team members"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  startAdornment={<Search size={14} />}
                  endAdornment={
                    search ? (
                      <button
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                      >
                        <X size={13} />
                      </button>
                    ) : undefined
                  }
                />
              </div>
            </div>
            {filtered.length ? (
              <div
                className={`grid gap-4 ${view === "grid" ? "md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"}`}
              >
                {filtered.map((user) => (
                  <UserTaskCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={
                  users.length
                    ? "No matches just yet."
                    : "Good work starts with good people."
                }
                description={
                  users.length
                    ? "Try a different name, email, or filter to find your teammate."
                    : "Add your first team member, then give their next task a place to live."
                }
                action={
                  users.length ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    createButton
                  )
                }
              />
            )}
          </section>
          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            A shared view. A clearer way forward.
          </p>
        </>
      )}
    </div>
  );
}
