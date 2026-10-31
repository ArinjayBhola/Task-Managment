import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Clock3,
  Trash2,
  Save,
  GitBranch,
  Link2,
  LayoutGrid,
} from "lucide-react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import {
  PageHeading,
  Notice,
  LoadError,
} from "../../components/workspace/WorkspaceUI";
import WorkflowGraph, {
  layoutNodes,
} from "../../components/workflows/WorkflowGraph";
import useWorkspaceData from "../../hooks/useWorkspaceData";
import api from "../../utils/axiosInstance";
import { notify } from "../../utils/notifications";

export default function WorkflowEditor() {
  const { templateId } = useParams(),
    navigate = useNavigate();
  const members = useWorkspaceData("/admin/bulk");
  const [name, setName] = useState(""),
    [nodes, setNodes] = useState([]),
    [selected, setSelected] = useState(null);
  const [versions, setVersions] = useState([]),
    [loaded, setLoaded] = useState(!templateId),
    [loadError, setLoadError] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [connect, setConnect] = useState(false),
    [source, setSource] = useState(null);
  useEffect(() => {
    if (!templateId) return;
    const controller = new AbortController();
    Promise.all([
      api.get("/workflows/templates", { signal: controller.signal }),
      api.get(`/workflows/templates/${templateId}/versions`, {
        signal: controller.signal,
      }),
    ])
      .then(([templates, history]) => {
        const template = templates.data.find((item) => item.id === templateId);
        if (!template) throw new Error("Workflow not found");
        setName(template.name);
        setNodes(template.definition.nodes);
        setSelected(template.definition.nodes[0]?.key);
        setVersions(history.data);
        setLoaded(true);
      })
      .catch((failure) => {
        if (failure.code !== "ERR_CANCELED") setLoadError(true);
      });
    return () => controller.abort();
  }, [templateId]);
  const memberOptions = (Array.isArray(members.data) ? members.data : []).map(
    (user) => ({ value: user.id, label: user.name || user.email }),
  );
  const node = nodes.find((item) => item.key === selected);
  function change(patch) {
    setNodes((previous) =>
      previous.map((item) =>
        item.key === selected ? { ...item, ...patch } : item,
      ),
    );
    setError("");
  }
  function add(type) {
    const key = crypto.randomUUID();
    const next =
      type === "task"
        ? {
            key,
            type,
            title: "New assignment",
            description: "",
            assigneeId: memberOptions[0]?.value || "",
            dueDays: 3,
            requiresApproval: true,
            dependencies: [],
          }
        : type === "condition"
          ? {
              key,
              type,
              title: "Choose a path",
              sourceKey: nodes.find((item) => item.type === "task")?.key || "",
              operator: "contains",
              keyword: "",
              dependencies: nodes.find((item) => item.type === "task")
                ? [nodes.find((item) => item.type === "task").key]
                : [],
            }
          : {
              key,
              type,
              title: "Wait before next step",
              waitHours: 24,
              dependencies: [],
            };
    setNodes((previous) => layoutNodes([...previous, next]));
    setSelected(key);
  }
  function select(key) {
    if (!connect) {
      setSelected(key);
      return;
    }
    if (!source) {
      setSource(key);
      return;
    }
    if (source === key) {
      setError("Choose a different target step.");
      return;
    }
    const next = nodes.map((item) =>
      item.key === key
        ? {
            ...item,
            dependencies: [...new Set([...item.dependencies, source])],
          }
        : item,
    );
    setNodes(next);
    setSource(null);
    setConnect(false);
    setSelected(key);
  }
  async function publish(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api[templateId ? "put" : "post"](
        `/workflows/templates${templateId ? `/${templateId}` : ""}`,
        { name, definition: { nodes } },
      );
      notify(
        `Version ${data.latest_version} published. Existing runs keep their original version.`,
      );
      navigate("/admin/workflows");
    } catch (failure) {
      const message =
        failure.response?.data?.message || "Unable to publish the workflow.";
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  }
  if (loadError || members.error)
    return (
      <div className="page-wrap">
        <LoadError
          message="Unable to load the workflow editor."
          retry={() => window.location.reload()}
        />
      </div>
    );
  if (!loaded || members.loading)
    return (
      <div className="page-wrap" role="status">
        Loading workflow editor…
      </div>
    );
  return (
    <form onSubmit={publish} className="page-wrap">
      <Link
        to="/admin/workflows"
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} />
        Back to workflows
      </Link>
      <PageHeading
        eyebrow="Design a repeatable process"
        title={templateId ? "Refine your workflow" : "Build your workflow"}
        description="Add steps, connect dependencies, and decide where approval is needed. Parallel branches can join at a shared next step."
        action={
          <Button type="submit" disabled={busy || !nodes.length}>
            <Save size={15} />
            {busy
              ? "Publishing…"
              : templateId
                ? "Publish new version"
                : "Publish workflow"}
          </Button>
        }
      />
      {error && (
        <div className="mb-5">
          <Notice>{error}</Notice>
        </div>
      )}
      <div className="surface mb-5 p-5">
        <Input
          label="Workflow name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => add("task")}
          disabled={nodes.length >= 40}
        >
          <Plus size={14} />
          Add task
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => add("delay")}
          disabled={nodes.length >= 40}
        >
          <Clock3 size={14} />
          Add timer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => add("condition")}
          disabled={nodes.length >= 40}
        >
          <GitBranch size={14} />
          Add condition
        </Button>
        <Button
          size="sm"
          variant={connect ? "default" : "outline"}
          onClick={() => {
            setConnect(!connect);
            setSource(null);
          }}
          disabled={nodes.length < 2}
        >
          <Link2 size={14} />
          {connect
            ? source
              ? "Select target step"
              : "Select source step"
            : "Connect steps"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setNodes(
              layoutNodes(
                nodes.map((item) => ({ ...item, position: undefined })),
              ),
            )
          }
        >
          <LayoutGrid size={14} />
          Arrange
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {nodes.length}/40 steps · Drag to arrange
        </span>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <WorkflowGraph
            nodes={nodes}
            selected={source || selected}
            onSelect={select}
            onMove={(key, position) =>
              setNodes((previous) =>
                previous.map((item) =>
                  item.key === key ? { ...item, position } : item,
                ),
              )
            }
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            An arrow means “complete this first.” All incoming dependencies must
            finish before the next step unlocks. Use arrow keys to move a
            focused step.
          </p>
        </div>
        <aside className="surface p-5">
          {node ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Step settings</h2>
                <button
                  type="button"
                  aria-label="Remove step"
                  onClick={() => {
                    setNodes(
                      nodes
                        .filter((item) => item.key !== selected)
                        .map((item) => ({
                          ...item,
                          dependencies: item.dependencies.filter(
                            (key) => key !== selected,
                          ),
                        })),
                    );
                    setSelected(null);
                  }}
                  className="rounded-lg p-2 text-destructive hover:bg-muted"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <Input
                label="Step title"
                value={node.title}
                onChange={(event) => change({ title: event.target.value })}
                maxLength={120}
              />
              {node.type === "task" ? (
                <>
                  <Input
                    label="Assignment instructions"
                    multiline
                    minRows={3}
                    value={node.description}
                    onChange={(event) =>
                      change({ description: event.target.value })
                    }
                    maxLength={10000}
                  />
                  <Select
                    label="Assigned member"
                    value={node.assigneeId || ""}
                    options={[
                      { value: "", label: "Choose a member" },
                      ...memberOptions,
                    ]}
                    onChange={(event) =>
                      change({ assigneeId: event.target.value })
                    }
                  />
                  <Input
                    label="Due in days after unlock"
                    type="number"
                    min={1}
                    max={365}
                    value={node.dueDays}
                    onChange={(event) =>
                      change({
                        dueDays:
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                      })
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={node.requiresApproval}
                        onChange={(event) =>
                          change({ requiresApproval: event.target.checked })
                        }
                      />
                    }
                    label={
                      <span className="text-xs">Admin approval required</span>
                    }
                  />
                  <p className="!mt-1 text-xs leading-5 text-muted-foreground">
                    The admin who starts the run reviews submissions. Rejected
                    work returns to its owner with feedback.
                  </p>
                </>
              ) : node.type === "condition" ? (
                <>
                  <Select
                    label="Read submission from"
                    value={node.sourceKey}
                    options={[
                      { value: "", label: "Choose a task" },
                      ...nodes
                        .filter((item) => item.type === "task")
                        .map((item) => ({
                          value: item.key,
                          label: item.title,
                        })),
                    ]}
                    onChange={(event) =>
                      change({
                        sourceKey: event.target.value,
                        dependencies: [
                          ...new Set([
                            ...node.dependencies,
                            event.target.value,
                          ]),
                        ].filter(Boolean),
                      })
                    }
                  />
                  <Select
                    label="Submission rule"
                    value={node.operator}
                    options={[
                      { value: "contains", label: "Contains text" },
                      { value: "not_contains", label: "Does not contain text" },
                    ]}
                    onChange={(event) =>
                      change({ operator: event.target.value })
                    }
                  />
                  <Input
                    label="Text to match"
                    value={node.keyword}
                    maxLength={200}
                    onChange={(event) =>
                      change({ keyword: event.target.value })
                    }
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Runs after the source task is complete. Matching ignores
                    letter case. Set downstream steps to the matched or
                    unmatched path.
                  </p>
                </>
              ) : (
                <Input
                  label="Wait duration in hours"
                  type="number"
                  min={0.01}
                  max={8760}
                  step={0.01}
                  value={node.waitHours}
                  onChange={(event) =>
                    change({
                      waitHours:
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                    })
                  }
                />
              )}
              <Autocomplete
                multiple
                options={nodes.filter((item) => item.key !== selected)}
                value={nodes.filter((item) =>
                  node.dependencies.includes(item.key),
                )}
                getOptionLabel={(item) => item.title || "Untitled step"}
                isOptionEqualToValue={(a, b) => a.key === b.key}
                onChange={(_event, value) =>
                  change({ dependencies: value.map((item) => item.key) })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Wait for steps" size="small" />
                )}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {node.dependencies.length
                  ? `${node.dependencies.length} prerequisites must finish.`
                  : "This step starts when the run begins."}
              </p>
              {nodes.some(
                (item) => item.type === "condition" && item.key !== selected,
              ) && (
                <Select
                  label="Branch rule"
                  value={
                    node.when ? `${node.when.nodeKey}:${node.when.outcome}` : ""
                  }
                  options={[
                    { value: "", label: "No branch condition" },
                    ...nodes
                      .filter(
                        (item) =>
                          item.type === "condition" && item.key !== selected,
                      )
                      .flatMap((item) => [
                        {
                          value: `${item.key}:true`,
                          label: `${item.title}: matched`,
                        },
                        {
                          value: `${item.key}:false`,
                          label: `${item.title}: did not match`,
                        },
                      ]),
                  ]}
                  onChange={(event) => {
                    if (!event.target.value) {
                      change({ when: undefined });
                      return;
                    }
                    const [nodeKey, outcome] = event.target.value.split(":");
                    change({
                      when: { nodeKey, outcome: outcome === "true" },
                      dependencies: [
                        ...new Set([...node.dependencies, nodeKey]),
                      ],
                    });
                  }}
                />
              )}
              {node.dependencies.length > 1 && (
                <Select
                  label="Join behavior"
                  value={node.join || "all"}
                  options={[
                    {
                      value: "all",
                      label: "All prerequisite paths must complete",
                    },
                    {
                      value: "any",
                      label: "Continue after selected paths finish",
                    },
                  ]}
                  onChange={(event) => change({ join: event.target.value })}
                />
              )}
              {node.join === "any" && (
                <p className="text-xs leading-5 text-muted-foreground">
                  Waits for every incoming path to finish or skip, then
                  continues if at least one completed. Use this to merge
                  conditional branches.
                </p>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <GitBranch size={26} className="mx-auto mb-4 text-primary" />
              <h2 className="text-sm font-semibold">
                Every process has a first step.
              </h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Add or select a step to configure its assignment and
                dependencies.
              </p>
            </div>
          )}
        </aside>
      </div>
      {versions.length > 0 && (
        <section className="surface mt-7 p-5">
          <h2 className="mb-4 text-sm font-semibold">Published versions</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Load an earlier version into this editor and publish it as a new
            version. Running processes remain unchanged.
          </p>
          <div className="space-y-2">
            {versions.map((item) => (
              <div
                key={item.version}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
              >
                <span className="text-xs">
                  Version {item.version} · {item.definition.nodes.length} steps
                  · {new Date(item.created_at).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNodes(structuredClone(item.definition.nodes));
                    setSelected(item.definition.nodes[0]?.key);
                    notify(`Version ${item.version} loaded into the editor.`);
                  }}
                >
                  Load into editor
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </form>
  );
}
