import { create } from "zustand";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface TaskState {
  tasks: Task[];
  taskCount: number;

  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

export const useTaskStore = create<TaskState>()((set) => ({
  tasks: [],
  taskCount: 0,

  addTask: (task) =>
    set((state) => {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      const tasks = [...state.tasks, newTask];
      return {
        tasks,
        taskCount: tasks.filter((t) => !t.completed).length,
      };
    }),

  toggleTask: (id) =>
    set((state) => {
      const tasks = state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      return {
        tasks,
        taskCount: tasks.filter((t) => !t.completed).length,
      };
    }),

  removeTask: (id) =>
    set((state) => {
      const tasks = state.tasks.filter((task) => task.id !== id);
      return {
        tasks,
        taskCount: tasks.filter((t) => !t.completed).length,
      };
    }),

  clearCompleted: () =>
    set((state) => {
      const tasks = state.tasks.filter((task) => !task.completed);
      return {
        tasks,
        taskCount: tasks.length,
      };
    }),
}));
