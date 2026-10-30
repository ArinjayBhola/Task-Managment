import React, { useState, useEffect } from "react";
import { TaskListItem } from "../components/tasks/TaskListItem";
import { TaskDetailPanel } from "../components/tasks/TaskDetailPanel";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { Task } from "../types";
import { Plus, Filter, ArrowUpDown, List, LayoutGrid } from "lucide-react";
import { useTaskStore } from "../store/tasks";
import { useTaskShortcuts } from "../hooks/useTaskShortcuts";
import { cn } from "../lib/utils";

const INITIAL_MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Implement real-time presence with Durable Objects",
    status: "in-progress",
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    description: "We need to ensure users can see who is currently viewing the same task. Durable Objects is the best fit for this in Cloudflare."
  },
  {
    id: "2",
    title: "Refactor database schema for multi-tenancy",
    status: "done",
    priority: "urgent",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: "Adding org_id to all tables to ensure strict data isolation."
  },
  {
    id: "3",
    title: "Design premium dark mode theme",
    status: "todo",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: "Focus on Zinc palette and high-contrast typography."
  },
  {
    id: "4",
    title: "Add keyboard shortcuts for task status transitions",
    status: "backlog",
    priority: "low",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const Index = () => {
  const { tasks, setTasks, updateTask } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"list" | "card">("list");

  useTaskShortcuts(selectedTask?.id || null);

  useEffect(() => {
    if (tasks.length === 0) {
      setTasks(INITIAL_MOCK_TASKS);
    }
  }, [tasks, setTasks]);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Project Tasks</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border/40">
             <button
               onClick={() => setView("list")}
               className={cn("p-1.5 rounded-md transition-all", view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
             >
               <List size={16} />
             </button>
             <button
               onClick={() => setView("card")}
               className={cn("p-1.5 rounded-md transition-all", view === "card" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
             >
               <LayoutGrid size={16} />
             </button>
          </div>
          <div className="h-6 w-px bg-border/60" />
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="border border-border/60 rounded-xl overflow-hidden bg-background divide-y divide-border/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
              isSelected={selectedTask?.id === task.id}
            />
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <KanbanBoard tasks={tasks} onTaskClick={setSelectedTask} />
        </div>
      )}

      <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};
