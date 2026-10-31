import { Link, useNavigate, useParams } from "react-router-dom";
import DeleteUserButton from "../../components/DeleteUserButton";
import { ArrowLeft, Plus, Mail } from "lucide-react";
import useWorkspaceData from "../../hooks/useWorkspaceData";
import HomeShimmer from "../../components/HomeShimmer";
import TaskDetails from "../../components/TaskDetails";
import { Button } from "../../components/ui/Button";
import {
  PageHeading,
  Metrics,
  EmptyState,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
export default function SingleUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    data: user,
    loading,
    error,
    retry,
  } = useWorkspaceData(`/admin/user/${userId}`);
  const tasks = user?.tasks || user?.tasksAssigned || [];
  return (
    <div className="page-wrap">
      <Link
        to="/users"
        className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        Back to your team
      </Link>
      {loading ? (
        <HomeShimmer />
      ) : error ? (
        <LoadError retry={retry} message="We couldn’t load this team member." />
      ) : (
        <>
          <PageHeading
            eyebrow="Team member"
            title={user?.name || "Team member"}
            description={
              <span className="inline-flex items-center gap-2">
                <Mail size={13} />
                {user?.email}
              </span>
            }
            action={
              <div className="flex flex-wrap gap-3">
                <Link to={`/task/${userId}`}>
                  <Button>
                    <Plus size={15} />
                    Assign a task
                  </Button>
                </Link>
                {user && (
                  <DeleteUserButton
                    user={user}
                    onDeleted={() => navigate("/users", { replace: true })}
                  />
                )}
              </div>
            }
          />
          <Metrics users={[user]} tasks={tasks} personal />
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">Assigned tasks</h2>
            <span className="text-xs text-muted-foreground">
              {tasks.length} total
            </span>
          </div>
          {tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Link
                  className="block"
                  to={`/admin-edittask/${task.id}`}
                  key={task.id}
                >
                  <TaskDetails task={task} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="A fresh start for good work."
              description="Give this teammate their first task. A clear assignment is the beginning of real progress."
              action={
                <Link to={`/task/${userId}`}>
                  <Button variant="outline">
                    <Plus size={14} />
                    Assign first task
                  </Button>
                </Link>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
