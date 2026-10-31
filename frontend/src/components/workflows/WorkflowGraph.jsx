/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { useRef } from "react";
import {
  Clock3,
  GripVertical,
  ShieldCheck,
  ArrowRight,
  GitBranch,
} from "lucide-react";

export const workflowStateLabel = (state) =>
  ({
    blocked: "Waiting on dependencies",
    ready: "Ready to start",
    in_progress: "In progress",
    in_review: "Awaiting approval",
    completed: "Completed",
    canceled: "Canceled",
    skipped: "Skipped branch",
  })[state] || "Planned";

export function layoutNodes(nodes) {
  const levels = new Map();
  const level = (node, seen = new Set()) => {
    if (levels.has(node.key)) return levels.get(node.key);
    if (seen.has(node.key)) return 0;
    const next = new Set([...seen, node.key]);
    const parents = (node.dependencies || [])
      .map((key) => nodes.find((n) => n.key === key))
      .filter(Boolean);
    const depth = parents.length
      ? 1 + Math.max(...parents.map((parent) => level(parent, next)))
      : 0;
    levels.set(node.key, depth);
    return depth;
  };
  const rows = new Map();
  return nodes.map((node) => {
    const depth = level(node),
      row = rows.get(depth) || 0;
    rows.set(depth, row + 1);
    return {
      ...node,
      position: node.position || { x: 24 + depth * 280, y: 28 + row * 148 },
    };
  });
}

export default function WorkflowGraph({ nodes, selected, onSelect, onMove }) {
  const drag = useRef(null);
  const positioned = layoutNodes(nodes);
  const width = Math.max(
    760,
    ...positioned.map((node) => node.position.x + 260),
  );
  const height = Math.max(
    300,
    ...positioned.map((node) => node.position.y + 140),
  );
  return (
    <div
      className="overflow-auto rounded-xl border border-border bg-background"
      aria-label="Workflow canvas"
    >
      <div className="relative" style={{ width, height }}>
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height={height}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="workflow-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6" fill="currentColor" />
            </marker>
          </defs>
          {positioned.flatMap((node) =>
            (node.dependencies || []).map((key) => {
              const parent = positioned.find((n) => n.key === key);
              if (!parent) return null;
              const x = parent.position.x + 232,
                y = parent.position.y + 48,
                endX = node.position.x,
                endY = node.position.y + 48;
              return (
                <path
                  key={`${key}-${node.key}`}
                  d={`M${x},${y} C${x + 40},${y} ${endX - 40},${endY} ${endX - 4},${endY}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  markerEnd="url(#workflow-arrow)"
                  className={
                    parent.state === "completed"
                      ? "text-primary"
                      : "text-muted-foreground/40"
                  }
                />
              );
            }),
          )}
        </svg>
        {positioned.map((node, index) => (
          <button
            key={node.key}
            type="button"
            aria-label={`Step ${index + 1}: ${node.title || "Untitled step"}`}
            aria-pressed={selected === node.key}
            onClick={() => onSelect?.(node.key)}
            onPointerDown={(event) => {
              if (!onMove) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                key: node.key,
                x: event.clientX,
                y: event.clientY,
                position: node.position,
              };
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              if (start?.key === node.key && onMove)
                onMove(node.key, {
                  x: Math.max(
                    8,
                    Math.min(3700, start.position.x + event.clientX - start.x),
                  ),
                  y: Math.max(
                    8,
                    Math.min(3800, start.position.y + event.clientY - start.y),
                  ),
                });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onKeyDown={(event) => {
              if (
                !onMove ||
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  event.key,
                )
              )
                return;
              event.preventDefault();
              onMove(node.key, {
                x: Math.max(
                  8,
                  Math.min(
                    3700,
                    node.position.x +
                      (event.key === "ArrowLeft"
                        ? -20
                        : event.key === "ArrowRight"
                          ? 20
                          : 0),
                  ),
                ),
                y: Math.max(
                  8,
                  Math.min(
                    3800,
                    node.position.y +
                      (event.key === "ArrowUp"
                        ? -20
                        : event.key === "ArrowDown"
                          ? 20
                          : 0),
                  ),
                ),
              });
            }}
            style={{
              left: node.position.x,
              top: node.position.y,
              touchAction: onMove ? "none" : "auto",
            }}
            className={`absolute w-[232px] rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md ${selected === node.key ? "border-primary ring-2 ring-primary/15" : node.state === "completed" ? "border-primary/50" : "border-border"}`}
          >
            <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="flex items-center gap-1.5">
                {node.type === "delay" ? (
                  <Clock3 size={12} />
                ) : node.type === "condition" ? (
                  <GitBranch size={12} />
                ) : node.requiresApproval ? (
                  <ShieldCheck size={12} />
                ) : (
                  <ArrowRight size={12} />
                )}
                {node.type === "delay"
                  ? "Timer"
                  : node.type === "condition"
                    ? "Condition"
                    : node.requiresApproval
                      ? "Task + approval"
                      : "Task"}
              </span>
              {onMove && <GripVertical size={13} />}
            </span>
            <span className="block truncate text-sm font-semibold">
              {node.title || "Untitled step"}
            </span>
            <span className="mt-2 block truncate text-xs text-muted-foreground">
              {node.state
                ? node.type === "condition" && node.state === "completed"
                  ? node.outcome
                    ? "Matched"
                    : "Did not match"
                  : workflowStateLabel(node.state)
                : node.type === "delay"
                  ? `Wait ${node.waitHours} hours`
                  : node.type === "condition"
                    ? `${node.operator === "not_contains" ? "Does not contain" : "Contains"}: ${node.keyword || "…"}`
                    : `Due ${node.dueDays} days after unlock`}
            </span>
          </button>
        ))}
        {!nodes.length && (
          <p className="p-8 text-sm text-muted-foreground">
            Add your first step to start building.
          </p>
        )}
      </div>
    </div>
  );
}
