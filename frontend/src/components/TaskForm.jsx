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
  async function submit(event) {
    event.preventDefault();
    if (create && (!dueDate || dateInvalid)) {
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
          id: /^\d+$/.test(id) ? Number(id) : id,
          comments,
        });
      else if (admin)
        await api.put("/admin/admincomment", {
          taskId: data.id,
          usersId: data.userId,
          comment: comments,
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
      if (create) {
        setDescription("");
        setComments("");
        setDueDate("");
      }
    } catch (failure) {
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
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setSaving(true);
    setError("");
    try {
      await api.delete("/admin/delete", { data: { taskId: data.id } });
      navigate("/users");
    } catch (failure) {
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
              ? "Keep the conversation moving."
              : "A little progress, every day."
        }
        description={
          create
            ? "A thoughtful assignment gives your teammate clarity, context, and room to do their best."
            : admin
              ? "Review this assignment and leave a helpful note for your teammate."
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
              <div className="flex items-center gap-3 rounded-lg bg-background p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-primary">
                  <UserRound size={17} />
                </span>
                <div>
                  <p className="text-[10px] text-muted-foreground">
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
                readOnly={!create}
                required
                maxLength={2000}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <DateInput
                  label="Due date"
                  value={dueDate}
                  onChange={setDueDate}
                  onValidationChange={setDateInvalid}
                  readOnly={!create}
                  required={create}
                />
                <Select
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={!create && admin}
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
              <div className="space-y-2">
                <label
                  htmlFor="task-notes"
                  className="block text-xs font-semibold"
                >
                  {create
                    ? "A little context"
                    : admin
                      ? "Admin notes"
                      : "Progress notes"}{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="task-notes"
                  className="field min-h-[140px] resize-y leading-6"
                  placeholder="Share useful details, links, or a little direction…"
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  A clear note can make all the difference.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/50 px-6 py-4">
              {!create && admin ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={remove}
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
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
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
