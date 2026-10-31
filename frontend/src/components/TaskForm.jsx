/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Loader2,
  MessageSquare,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "../utils/axiosInstance";
import useWorkspaceData from "../hooks/useWorkspaceData";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import DateInput from "./ui/DateInput";
import HomeShimmer from "./HomeShimmer";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { notify } from "../utils/notifications";
import { workflowStateLabel } from "./workflows/WorkflowGraph";
import {
  LoadError,
  Notice,
  PageHeading,
  StatusBadge,
} from "./workspace/WorkspaceUI";

export default function TaskForm({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const create = mode === "create";
  const admin = mode !== "user";
  const endpoint = create
    ? `/admin/user/${id}`
    : admin
      ? `/admin/task/${id}`
      : `/user/bulktask/${id}`;
  const {
    data,
    loading: fetching,
    error: fetchError,
    retry,
  } = useWorkspaceData(endpoint);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dateInvalid, setDateInvalid] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => {
    if (!data || create) return;
    setDescription(data.description || data.title || "");
    setDueDate((data.dueDate || "").slice(0, 10));
    setStatus(data.status || "Not Started");
    setComments(data.comments || "");
  }, [data, create]);
  const name = create
    ? data?.name
    : data?.user?.name || data?.assignee?.name || "Team member";
  const workflow = !create && Boolean(data?.workflowRunId);
  const canWork =
    workflow &&
    !admin &&
    ["ready", "in_progress"].includes(data?.workflowState);
  async function workflowAction(action) {
    setSaving(true);
    setError("");
    try {
      await api.post(`/workflow-tasks/${data.id}/actions`, {
        action,
        message: comments,
      });
      notify(
        action === "start"
          ? "Work started."
          : data.requiresApproval
            ? "Submitted for admin review."
            : "Task completed. Next steps unlocked.",
      );
      retry();
    } catch (failure) {
      setError(
        failure.response?.data?.message || "Unable to update assignment.",
      );
      notify(
        failure.response?.data?.message || "Unable to update assignment.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (workflow) return;
    if (admin && (!dueDate || dateInvalid)) {
      setError("Choose a valid due date before assigning this task.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (create)
        await api.post("/admin/task", {
          description,
          dueDate,
          status,
          id,
          comments,
        });
      else if (admin)
        await api.put(`/admin/task/${data.id}`, {
          description,
          dueDate,
          status,
          comments,
        });
      else
        await api.put("/user/taskupdate", {
          taskId: data.id,
          status,
          comments,
        });
      setSuccess(
        create
          ? "Task assigned. A clear next step for your teammate."
          : "Your changes have been saved.",
      );
      notify(create ? "Task assigned." : "Task updated.");
      if (create) {
        setDescription("");
        setComments("");
        setDueDate("");
      }
    } catch (failure) {
      notify(
        failure.response?.data?.message || "Unable to save task.",
        "error",
      );
      setError(
        failure.response?.data?.message ||
          failure.response?.data?.error ||
          "We couldn’t save this task. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    setDeleteOpen(false);
    setSaving(true);
    setError("");
    try {
      await api.delete("/admin/delete", { data: { taskId: data.id } });
      notify("Task deleted.");
      navigate("/users");
    } catch (failure) {
      notify(
        failure.response?.data?.message || "Unable to delete task.",
        "error",
      );
      setError(
        failure.response?.data?.message ||
          "We couldn’t delete this task. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="page-wrap">
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this task?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-muted-foreground">
            This permanently removes the assignment and its notes.
          </p>
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} disabled={saving}>
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
      <Link
        to={admin ? "/users" : "/mytasks"}
        className="mb-7 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        {admin ? "Back to your team" : "Back to your tasks"}
      </Link>
      <PageHeading
        eyebrow={
          create ? "Give good work a starting point" : "The details matter"
        }
        title={
          create
            ? "A clear next step."
            : admin
              ? "Edit task"
              : "A little progress, every day."
        }
        description={
          create
            ? "A thoughtful assignment gives your teammate clarity, context, and room to do their best."
            : admin
              ? "Update the assignment, deadline, status, and notes for your teammate."
              : "Update your progress and let your team know how things are going."
        }
      />
      {fetching ? (
        <HomeShimmer />
      ) : fetchError ? (
        <LoadError retry={retry} message="We couldn’t load the task details." />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <form onSubmit={submit} className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="text-sm font-semibold">
                {create ? "Task information" : "Your assignment"}
              </h2>
              {!create && <StatusBadge status={data?.status} />}
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              {error && <Notice>{error}</Notice>}
              {success && <Notice success>{success}</Notice>}
              {workflow && (
                <div className="rounded-lg border border-primary/20 bg-accent p-4">
                  <p className="text-sm font-semibold text-primary">
                    {workflowStateLabel(data.workflowState)}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {admin
                      ? "This assignment belongs to a workflow. Review submissions and manage its progress from the execution view."
                      : data.workflowState === "in_review"
                        ? "Your submission is with your admin. We will notify you when it is reviewed."
                        : data.workflowState === "completed"
                          ? "This assignment is complete."
                          : data.workflowState === "canceled"
                            ? "Your admin canceled this assignment."
                            : data.requiresApproval
                              ? "Submit your work when ready. Your admin must approve it before the next step can begin."
                              : "Complete your assignment to unlock the next step."}
                  </p>
                  {data.reviewFeedback && (
                    <p className="mt-3 whitespace-pre-wrap border-t border-primary/15 pt-3 text-xs leading-6">
                      Admin feedback: {data.reviewFeedback}
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg bg-background p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-primary">
                  <UserRound size={17} />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Assigned to
                  </p>
                  <p className="mt-1 text-xs font-semibold">{name}</p>
                </div>
              </div>
              <Input
                label="What needs to get done?"
                placeholder="e.g. Prepare the first draft of the project proposal"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                readOnly={!admin || workflow}
                required
                maxLength={2000}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <DateInput
                  label="Due date"
                  value={dueDate}
                  onChange={setDueDate}
                  onValidationChange={setDateInvalid}
                  readOnly={!admin || workflow}
                  required={admin && !workflow}
                />
                <Select
                  label="Status"
                  disabled={workflow}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  options={[
                    { value: "Not Started", label: "To do" },
                    { value: "In Progress", label: "In progress" },
                    { value: "Completed", label: "Completed" },
                    ...(!["Not Started", "In Progress", "Completed"].includes(
                      status,
                    )
                      ? [{ value: status, label: status }]
                      : []),
                  ]}
                />
              </div>
              {!admin && data?.adminComments && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="mb-2 text-xs font-semibold">
                    Assignment notes from your admin
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {data.adminComments}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Input
                  id="task-notes"
                  label={`${create ? "A little context" : admin ? "Admin notes" : "Progress notes"} (optional)`}
                  multiline
                  minRows={4}
                  placeholder="Share useful details, links, or a little direction…"
                  value={comments}
                  readOnly={workflow && !canWork}
                  onChange={(event) => setComments(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A clear note can make all the difference.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/50 px-6 py-4">
              {workflow && admin ? (
                <Link
                  to={`/admin/workflows/runs/${data.workflowRunId}`}
                  className="text-xs font-semibold text-primary"
                >
                  View workflow →
                </Link>
              ) : !create && admin ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteOpen(true)}
                  disabled={saving}
                >
                  <Trash2 size={14} />
                  Delete task
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate(admin ? "/users" : "/mytasks")}
                >
                  Cancel
                </Button>
              )}
              {workflow ? (
                canWork && (
                  <div className="flex flex-wrap gap-2">
                    {data.workflowState === "ready" && (
                      <Button
                        variant="outline"
                        onClick={() => workflowAction("start")}
                        disabled={saving}
                      >
                        Start work
                      </Button>
                    )}
                    <Button
                      onClick={() => workflowAction("submit")}
                      disabled={saving}
                    >
                      {saving
                        ? "Saving…"
                        : data.requiresApproval
                          ? "Submit for review"
                          : "Complete assignment"}
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                )
              ) : (
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      {create ? "Assign task" : "Save changes"}
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
          <aside className="surface p-6">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <Check size={20} />
            </span>
            <h3 className="text-sm font-semibold">
              Good tasks have good details.
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              A little clarity now makes the next step easier.
            </p>
            <div className="mt-6 space-y-5">
              {[
                [
                  UserRound,
                  "Make it personal",
                  "Give one person a clear next step.",
                ],
                [
                  CalendarDays,
                  "Give it a timeframe",
                  "A realistic date helps everyone plan.",
                ],
                [
                  MessageSquare,
                  "Keep talking",
                  "Share the context behind the task.",
                ],
              ].map(([Icon, title, copy]) => (
                <div key={title} className="flex gap-3">
                  <Icon
                    size={15}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <h4 className="text-xs font-medium">{title}</h4>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
