import React, { createContext, useContext, useState } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskContextType {
  tasks: Task[];
  taskCount: number;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const taskCount = tasks.filter(task => !task.completed).length;

  return (
    <TaskContext.Provider value={{ tasks, taskCount, addTask, toggleTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
}

export function useTaskOptional() {
  return useContext(TaskContext);
}
