import { create } from "zustand";
import { Task } from "../types";

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
}));
