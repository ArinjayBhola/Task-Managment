import { useState } from "react";
import { Search, Users } from "lucide-react";
import useWorkspaceData from "../../hooks/useWorkspaceData";
import UserTaskCard from "../../components/UserTaskCard";
import HomeShimmer from "../../components/HomeShimmer";
import {
  PageHeading,
  Metrics,
  EmptyState,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
export default function AllUser() {
  const { data, loading, error, retry } = useWorkspaceData("/user/bulktask");
  const [search, setSearch] = useState("");
  const users = Array.isArray(data) ? data : [];
  const tasks = [
    ...new Map(
      users
        .flatMap((user) => user.tasks || user.tasksAssigned || [])
        .map((task) => [task.id, task]),
    ).values(),
  ];
  const filtered = users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Member workspace · Read-only overview"
        title="Team activity"
        description="Follow progress in your workspace. Manage your own assignments from My tasks."
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
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-base font-semibold">
              Around your workspace{" "}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {users.length} members
              </span>
            </h2>
            <div className="relative sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                aria-label="Search team members"
                className="field !py-2 !pl-9 text-xs"
                placeholder="Find a teammate…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {filtered.length ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((user) => (
                <UserTaskCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="A little room for your team."
              description={
                search
                  ? "No teammates match that search."
                  : "Your workspace members will appear here."
              }
            />
          )}
        </>
      )}
    </div>
  );
}
