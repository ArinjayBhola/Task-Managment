import React from "react";
import { cn } from "../../lib/utils";
import { Task, Priority, Status } from "../../types";
import { Circle, CheckCircle2, CircleDashed, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TaskListItemProps {
  task: Task;
  onClick: () => void;
  isSelected?: boolean;
}

export const TaskListItem = ({ task, onClick, isSelected }: TaskListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 px-4 py-2 hover:bg-accent/50 cursor-pointer border-b border-border/40 transition-colors",
        isSelected && "bg-accent"
      )}
    >
      <StatusIcon status={task.status} />
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium truncate text-foreground/90 group-hover:text-foreground">
          {task.title}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded leading-none shrink-0">
          ENG-{task.id.slice(0, 3)}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
        <PriorityBadge priority={task.priority} />
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
          AB
        </div>
      </div>
    </div>
  );
};

const StatusIcon = ({ status }: { status: Status }) => {
  switch (status) {
    case "done": return <CheckCircle2 className="text-primary" size={18} />;
    case "in-progress": return <Clock className="text-amber-500" size={18} />;
    case "canceled": return <CircleDashed className="text-muted-foreground" size={18} />;
    default: return <Circle className="text-muted-foreground/60" size={18} />;
  }
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    urgent: "text-red-500",
    high: "text-amber-500",
    medium: "text-blue-500",
    low: "text-zinc-500",
    none: "text-muted-foreground/40",
  };
  return <AlertCircle className={cn(colors[priority])} size={14} />;
};
