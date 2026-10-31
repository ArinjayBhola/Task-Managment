import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Clock3,
  Check,
  X,
} from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PageHeading,
  Notice,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
import WorkflowGraph, {
  workflowStateLabel,
} from "../../components/workflows/WorkflowGraph";
import { useAuth } from "../../hooks/useAuth";
import api from "../../utils/axiosInstance";
import { notify } from "../../utils/notifications";

export default function WorkflowRun() {
  const { runId } = useParams(),
    { user } = useAuth();
  const [run, setRun] = useState(null),
    [error, setError] = useState(false),
    [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await api.get(`/workflows/runs/${runId}`);
        if (active) {
          setRun(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }
    load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [runId, refresh]);
  async function act(action, nodeKey = "") {
    setBusy(true);
    try {
      await api.post(`/workflows/runs/${runId}/actions`, {
        action,
        nodeKey,
        message,
      });
      notify(
        action === "reject"
          ? "Changes requested. Feedback sent to the member."
          : action === "approve"
            ? "Approved. The next steps are now unlocked."
            : "Workflow updated.",
      );
      setDialog(null);
      setMessage("");
      setRefresh((value) => value + 1);
    } catch (failure) {
      notify(
        failure.response?.data?.message || "Unable to update workflow.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  if (error && !run)
    return (
      <div className="page-wrap">
        <LoadError
          retry={() => setRefresh((value) => value + 1)}
          message="Unable to load this workflow run."
        />
      </div>
    );
  if (!run)
    return (
      <div className="page-wrap" role="status">
        Loading workflow…
      </div>
    );
  const nodes = (run.steps || []).map((step) => ({
    ...step.spec,
    state: step.state,
    outcome: step.outcome,
  }));
  const step = run.steps.find((item) => item.node_key === selected);
  const completed = run.steps.filter((item) =>
      ["completed", "skipped"].includes(item.state),
    ).length,
    owner = run.created_by === user.id;
  const reviews = run.steps.filter((item) => item.state === "in_review");
  function review(action, nodeKey) {
    setMessage("");
    setDialog({ action, nodeKey });
  }
  return (
    <div className="page-wrap">
      <Link
        to="/admin/workflows"
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} />
        Back to workflows
      </Link>
      <PageHeading
        eyebrow={`Execution · Version ${run.version}`}
        title={run.name}
        description={`${completed} of ${run.steps.length} steps complete. ${owner ? "You own this run and its approval decisions." : "Only the admin who started this run can approve or cancel it."}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefresh((value) => value + 1)}
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
            {owner && run.state === "running" && !run.last_error && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => act("retry")}
                disabled={busy}
              >
                <Clock3 size={14} />
                Check timers
              </Button>
            )}
            {owner && run.state === "running" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => review("cancel", "")}
              >
                <X size={14} />
                Cancel run
              </Button>
            )}
          </div>
        }
      />
      {error && (
        <div className="mb-5">
          <Notice>
            Live updates are temporarily unavailable. Showing the last loaded
            state.
          </Notice>
        </div>
      )}
      {run.last_error && (
        <div className="mb-5">
          <Notice>{run.last_error}</Notice>
          {owner && run.state === "running" && (
            <Button
              className="mt-3"
              onClick={() => act("retry")}
              disabled={busy}
            >
              <RefreshCw size={14} />
              Retry advance
            </Button>
          )}
        </div>
      )}
      <div className="surface mb-6 p-5">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-semibold capitalize">{run.state}</span>
          <span className="text-muted-foreground">
            {Math.round((completed / run.steps.length) * 100)}% complete
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completed / run.steps.length) * 100}%` }}
          />
        </div>
      </div>
      {reviews.length > 0 && (
        <section className="surface mb-6 p-5">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ShieldCheck size={18} />
            <h2 className="text-sm font-semibold">Ready for your review</h2>
          </div>
          <div className="space-y-4">
            {reviews.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{item.spec.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted by {item.assignee_name || "assigned member"}
                    </p>
                  </div>
                  {owner && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => review("reject", item.node_key)}
                      >
                        Request changes
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => review("approve", item.node_key)}
                      >
                        <Check size={13} />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                  {item.submission || "No submission notes provided."}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      <WorkflowGraph nodes={nodes} selected={selected} onSelect={setSelected} />
      {step && (
        <section className="surface mt-5 p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <h2 className="text-sm font-semibold">{step.spec.title}</h2>
            <span className="text-xs text-primary">
              {workflowStateLabel(step.state)}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
            {step.spec.type === "condition"
              ? `Submission ${step.spec.operator === "not_contains" ? "does not contain" : "contains"} “${step.spec.keyword}”. ${step.outcome === null ? "Waiting to evaluate." : step.outcome ? "Matched." : "Did not match."}`
              : step.spec.type === "delay"
                ? `This timer waits ${step.spec.waitHours} hours after prerequisites complete.`
                : step.spec.description || "No additional instructions."}
          </p>
          {step.assignee_name && (
            <p className="mt-3 text-xs">Assigned to {step.assignee_name}</p>
          )}
          {step.due_at && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 size={13} />
              {step.spec.type === "delay" ? "Resumes" : "Due"}{" "}
              {new Date(step.due_at).toLocaleString()}
            </p>
          )}
          {step.feedback && (
            <p className="mt-3 text-xs leading-6">Feedback: {step.feedback}</p>
          )}
          {step.task_id && (
            <Link
              to={`/admin-edittask/${step.task_id}`}
              className="mt-4 inline-block text-xs font-semibold text-primary"
            >
              View assignment →
            </Link>
          )}
        </section>
      )}
      <section className="surface mt-6 p-5">
        <h2 className="mb-5 text-sm font-semibold">Execution timeline</h2>
        <div className="space-y-0">
          {run.events.map((event) => (
            <div
              key={event.id}
              className="relative border-l border-border pb-5 pl-5 last:pb-0"
            >
              <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-primary" />
              <p className="text-xs font-medium capitalize">
                {event.action.replaceAll("_", " ")}
                {event.node_key
                  ? ` · ${run.steps.find((item) => item.node_key === event.node_key)?.spec.title || "Step"}`
                  : ""}
              </p>
              {event.message && (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                  {event.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString()}
                {event.actor_role ? ` · ${event.actor_role}` : " · System"}
              </p>
            </div>
          ))}
        </div>
      </section>
      <Dialog
        open={Boolean(dialog)}
        onClose={() => !busy && setDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            act(dialog.action, dialog.nodeKey);
          }}
        >
          <DialogTitle>
            {dialog?.action === "reject"
              ? "Request changes"
              : dialog?.action === "approve"
                ? "Approve this submission?"
                : "Cancel this workflow?"}
          </DialogTitle>
          <DialogContent>
            <p className="mb-5 text-xs leading-6 text-muted-foreground">
              {dialog?.action === "reject"
                ? "Explain what needs to change. The member can revise and submit again."
                : dialog?.action === "approve"
                  ? "Approval completes this step and unlocks any ready downstream assignments."
                  : "Unfinished assignments will be canceled. Completed work and the audit trail will be kept."}
            </p>
            <div className="pt-2">
              <Input
                label={
                  dialog?.action === "reject"
                    ? "Feedback for the member"
                    : "Note (optional)"
                }
                multiline
                minRows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required={dialog?.action === "reject"}
                maxLength={20000}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              variant="ghost"
              onClick={() => setDialog(null)}
              disabled={busy}
            >
              Go back
            </Button>
            <Button
              type="submit"
              variant={dialog?.action === "cancel" ? "danger" : "default"}
              disabled={busy}
            >
              {busy
                ? "Saving…"
                : dialog?.action === "reject"
                  ? "Send feedback"
                  : dialog?.action === "approve"
                    ? "Approve & continue"
                    : "Cancel workflow"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
