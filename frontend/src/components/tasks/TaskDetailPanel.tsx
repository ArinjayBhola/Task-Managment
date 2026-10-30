import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Tag, Flag, Hash, ArrowRight, CheckCircle2 } from "lucide-react";
import { Task, Status, Priority } from "../../types";
import { cn } from "../../lib/utils";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskDetailPanel = ({ task, onClose }: TaskDetailPanelProps) => {
  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/20 backdrop-blur-sm z-30"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[540px] bg-background border-l border-border shadow-2xl z-40 flex flex-col"
          >
            <header className="flex items-center justify-between p-4 border-b h-14 shrink-0">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                <Hash size={14} className="text-primary/60" />
                <span>ENG-{task.id.slice(0, 3)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-md hover:bg-accent transition-colors">
                   <CheckCircle2 size={14} /> Mark Done
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight leading-tight">{task.title}</h2>

                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  <DetailField icon={User} label="Assignee" value="Arinjay Bhola" />
                  <DetailField icon={Flag} label="Priority" value={task.priority} />
                  <DetailField icon={Calendar} label="Due Date" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"} />
                  <DetailField icon={Tag} label="Project" value="Edge Engine" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight size={14} className="text-primary" /> Description
                </h3>
                <div className="text-sm text-foreground/80 leading-relaxed min-h-[120px] p-4 bg-muted/20 border border-transparent hover:border-border/60 rounded-xl transition-all cursor-text focus-within:bg-background focus-within:border-primary/20">
                  {task.description || "Add more details about this task..."}
                </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity Log</h3>
                 <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-border/60">
                   <ActivityItem user="AB" action="created the task" date="yesterday" isLast />
                   <ActivityItem user="AB" action="changed status to In Progress" date="2 hours ago" />
                 </div>
              </div>
            </div>

            <footer className="p-4 border-t h-16 flex items-center bg-muted/5 shrink-0">
              <div className="flex-1 relative">
                <input
                  placeholder="Type a comment or / to use commands..."
                  className="w-full bg-accent/40 rounded-lg px-4 py-2 text-sm border border-transparent focus:border-primary/20 outline-none placeholder:text-muted-foreground transition-all"
                />
              </div>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DetailField = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center gap-4 group">
    <div className="p-2.5 rounded-xl bg-muted/60 text-muted-foreground group-hover:text-primary transition-all duration-300">
      <Icon size={16} />
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{label}</span>
      <span className="text-sm font-semibold capitalize">{value}</span>
    </div>
  </div>
);

const ActivityItem = ({ user, action, date, isLast }: { user: string, action: string, date: string, isLast?: boolean }) => (
  <div className="flex items-start gap-4 relative">
    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 text-primary">
      {user}
    </div>
    <div className="flex flex-col gap-0.5 pt-0.5">
      <p className="text-xs text-foreground/90">
        <span className="font-bold">{user}</span> {action}
      </p>
      <span className="text-[10px] text-muted-foreground font-medium">{date}</span>
    </div>
  </div>
);
