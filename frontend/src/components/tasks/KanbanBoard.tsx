import React from "react";
import { Task, Status } from "../../types";
import { cn } from "../../lib/utils";
import { MoreHorizontal, Plus, Circle, CheckCircle2, CircleDashed, Clock } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const STATUS_COLUMNS: { label: string; status: Status; icon: any }[] = [
  { label: "Backlog", status: "backlog", icon: CircleDashed },
  { label: "Todo", status: "todo", icon: Circle },
  { label: "In Progress", status: "in-progress", icon: Clock },
  { label: "Done", status: "done", icon: CheckCircle2 },
];

export const KanbanBoard = ({ tasks, onTaskClick }: KanbanBoardProps) => {
  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 no-scrollbar">
      {STATUS_COLUMNS.map((col) => (
        <div key={col.status} className="flex flex-col w-[280px] shrink-0 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <col.icon size={14} className="text-muted-foreground" />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {tasks.filter((t) => t.status === col.status).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-accent rounded-md transition-colors"><Plus size={14} /></button>
              <button className="p-1 hover:bg-accent rounded-md transition-colors"><MoreHorizontal size={14} /></button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {tasks
              .filter((t) => t.status === col.status)
              .map((task) => (
                <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const KanbanCard = ({ task, onClick }: { task: Task; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="group p-4 bg-background border border-border/60 rounded-xl shadow-sm hover:border-primary/30 hover:shadow-md cursor-pointer transition-all space-y-3"
  >
    <div className="flex items-center justify-between">
       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
         ENG-{task.id.slice(0, 3)}
       </span>
       <div className={cn(
         "w-2 h-2 rounded-full",
         task.priority === 'urgent' ? "bg-red-500" :
         task.priority === 'high' ? "bg-amber-500" : "bg-zinc-500/20"
       )} />
    </div>
    <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
      {task.title}
    </h4>
    <div className="flex items-center justify-between pt-1">
      <div className="flex -space-x-1.5">
        <div className="w-5 h-5 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[8px] font-bold">AB</div>
      </div>
      {task.dueDate && (
        <span className="text-[10px] text-muted-foreground font-medium">
          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  </div>
);
