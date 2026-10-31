import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  GitBranch,
  Plus,
  Play,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import {
  PageHeading,
  EmptyState,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
import HomeShimmer from "../../components/HomeShimmer";
import useWorkspaceData from "../../hooks/useWorkspaceData";
import api from "../../utils/axiosInstance";
import { notify } from "../../utils/notifications";

export default function Workflows() {
  const templates = useWorkspaceData("/workflows/templates"),
    runs = useWorkspaceData("/workflows/runs");
  const [tab, setTab] = useState("templates"),
    [selected, setSelected] = useState(null);
  const [runName, setRunName] = useState(""),
    [version, setVersion] = useState(1),
    [busy, setBusy] = useState(false);
  const requestKey = useRef(null),
    navigate = useNavigate();
  const items = Array.isArray(templates.data) ? templates.data : [],
    executions = Array.isArray(runs.data) ? runs.data : [];
  function openRun(template) {
    requestKey.current = crypto.randomUUID();
    setSelected(template);
    setVersion(template.latest_version);
    setRunName(`${template.name} · ${new Date().toLocaleDateString()}`);
  }
  async function start(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/workflows/runs", {
        templateId: selected.id,
        version: Number(version),
        name: runName,
        requestKey: requestKey.current,
      });
      notify("Workflow started. Ready tasks have been assigned.");
      navigate(`/admin/workflows/runs/${data.id}`);
    } catch (error) {
      notify(
        error.response?.data?.message || "Unable to start the workflow.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-wrap">
      <PageHeading
        eyebrow="Admin console · Automation"
        title="Workflows"
        description="Turn a repeatable process into a clear path. Connect assignments, approvals, and timed handoffs."
        action={
          <Link to="/admin/workflows/new">
            <Button>
              <Plus size={16} />
              Create workflow
            </Button>
          </Link>
        }
      />
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        {[
          [GitBranch, items.length, "Reusable workflows"],
          [
            Play,
            executions.filter((run) => run.state === "running").length,
            "Running processes",
          ],
          [
            ShieldCheck,
            executions.reduce((sum, run) => sum + (run.reviews || 0), 0),
            "Waiting for review",
          ],
        ].map(([Icon, count, label]) => (
          <div key={label} className="surface flex items-center gap-4 p-5">
            <span className="rounded-xl bg-accent p-3 text-primary">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-2xl font-semibold">{count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-6 flex gap-2 border-b border-border pb-3">
        {["templates", "runs"].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${tab === value ? "bg-accent text-primary" : "text-muted-foreground"}`}
          >
            {value === "templates" ? "Workflow library" : "Execution history"}
          </button>
        ))}
      </div>
      {(tab === "templates" ? templates : runs).loading ? (
        <HomeShimmer />
      ) : (tab === "templates" ? templates : runs).error ? (
        <LoadError
          retry={(tab === "templates" ? templates : runs).retry}
          message="Unable to load workflows. Check that workflow setup has been run."
        />
      ) : tab === "templates" ? (
        items.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((template) => (
              <article key={template.id} className="surface flex flex-col p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-lg bg-accent p-2.5 text-primary">
                    <GitBranch size={19} />
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    Version {template.latest_version}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{template.name}</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {template.definition.nodes.length} steps ·{" "}
                  {
                    template.definition.nodes.filter(
                      (node) => node.requiresApproval,
                    ).length
                  }{" "}
                  approval gates ·{" "}
                  {
                    template.definition.nodes.filter(
                      (node) => node.type === "delay",
                    ).length
                  }{" "}
                  timers
                </p>
                <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-border pt-4">
                  <Link
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary"
                    to={`/admin/workflows/${template.id}/edit`}
                  >
                    Edit & versions
                    <ArrowRight size={14} />
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => openRun(template)}
                    disabled={template.needs_reassignment}
                  >
                    <Play size={13} />
                    {template.needs_reassignment
                      ? "Reassign to start"
                      : "Start run"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={GitBranch}
            title="Your first process starts here."
            description="Build a workflow once, then run it whenever your team needs it."
            action={
              <Link to="/admin/workflows/new">
                <Button>Create workflow</Button>
              </Link>
            }
          />
        )
      ) : executions.length ? (
        <div className="space-y-3">
          {executions.map((run) => (
            <Link
              key={run.id}
              to={`/admin/workflows/runs/${run.id}`}
              className="surface flex flex-wrap items-center justify-between gap-4 p-5 hover:border-primary/40"
            >
              <div>
                <h2 className="text-sm font-semibold">{run.name}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Version {run.version} · {run.completed}/{run.total} steps
                  complete · {new Date(run.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-accent px-3 py-1.5 text-xs text-primary">
                  {run.reviews ? `${run.reviews} awaiting review` : run.state}
                </span>
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock3}
          title="Ready when you are."
          description="Start a published workflow to see its progress and review requests here."
        />
      )}
      <Dialog
        open={Boolean(selected)}
        onClose={() => !busy && setSelected(null)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={start}>
          <DialogTitle>Start workflow</DialogTitle>
          <DialogContent>
            <p className="mb-5 text-xs leading-6 text-muted-foreground">
              Each run keeps its selected version. Tasks unlock only when all
              prerequisites are complete.
            </p>
            <div className="space-y-5 pt-2">
              <Input
                label="Run name"
                value={runName}
                onChange={(event) => {
                  setRunName(event.target.value);
                  requestKey.current = crypto.randomUUID();
                }}
                required
                maxLength={120}
              />
              <Select
                label="Published version"
                value={version}
                onChange={(event) => {
                  setVersion(event.target.value);
                  requestKey.current = crypto.randomUUID();
                }}
                options={Array.from(
                  { length: selected?.latest_version || 1 },
                  (_, index) => ({
                    value: index + 1,
                    label: `Version ${index + 1}${index + 1 === selected?.latest_version ? " (latest)" : ""}`,
                  }),
                )}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              variant="ghost"
              onClick={() => setSelected(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Starting…" : "Start workflow"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
