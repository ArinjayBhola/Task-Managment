import { useEffect } from "react";
import { useTaskStore } from "../store/tasks";
import { Status } from "../types";

export const useTaskShortcuts = (selectedTaskId: string | null) => {
  const { updateTask } = useTaskStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTaskId || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      const statusMap: Record<string, Status> = {
        "1": "backlog",
        "2": "todo",
        "3": "in-progress",
        "4": "done",
        "c": "canceled",
      };

      if (statusMap[e.key]) {
        updateTask(selectedTaskId, { status: statusMap[e.key] });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTaskId, updateTask]);
};
