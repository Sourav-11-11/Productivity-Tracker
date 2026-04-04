import { create } from 'zustand';
import { db } from '../db/db';
import type { Task } from '../db/db';

interface AppState {
  tasks: Task[];
  notes: string;
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updatedFields: Partial<Task>) => Promise<void>;
  setNotes: (text: string) => Promise<void>;
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>;
}

// Utility to get today's date string (e.g. "2026-04-03")
const getTodayId = () => new Date().toISOString().split('T')[0];

export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  notes: '',

  loadFromDB: async () => {
    try {
      const dbTasks = await db.tasks.toArray();
      const todayId = getTodayId();
      const todayLog = await db.dailyLogs.get(todayId);
      
      set({ 
        tasks: dbTasks, 
        notes: todayLog ? todayLog.notes : '' 
      });
    } catch (error) {
      console.error('Failed to load from DB:', error);
    }
  },

  saveToDB: async () => {
    const { tasks, notes } = get();
    try {
      // Bulk rewrite for manual full save if ever needed
      await db.transaction('rw', db.tasks, db.dailyLogs, async () => {
        await db.tasks.clear();
        await db.tasks.bulkAdd(tasks);
        
        const todayId = getTodayId();
        await db.dailyLogs.put({ id: todayId, date: todayId, notes });
      });
    } catch (error) {
      console.error('Failed to save to DB:', error);
    }
  },

  addTask: async (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }));
    await db.tasks.put(task); // Automatically persist on change
  },

  toggleTask: async (id) => {
    let updatedTask: Task | undefined;
    set((state) => {
      const newTasks = state.tasks.map((t) => {
        if (t.id === id) {
          updatedTask = { ...t, completed: !t.completed };
          return updatedTask;
        }
        return t;
      });
      return { tasks: newTasks };
    });
    
    if (updatedTask) {
      await db.tasks.put(updatedTask); // Automatically persist on change
    }
  },

  deleteTask: async (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    await db.tasks.delete(id); // Automatically persist on change
  },

  updateTask: async (id, updatedFields) => {
    let updatedTask: Task | undefined;
    set((state) => {
      const newTasks = state.tasks.map((t) => {
        if (t.id === id) {
          updatedTask = { ...t, ...updatedFields };
          return updatedTask;
        }
        return t;
      });
      return { tasks: newTasks };
    });

    if (updatedTask) {
      await db.tasks.put(updatedTask); // Automatically persist on change
    }
  },

  setNotes: async (text) => {
    set({ notes: text });
    const todayId = getTodayId();
    await db.dailyLogs.put({ id: todayId, date: todayId, notes: text }); // Automatically persist on change
  },

  reorderTasks: async (reorderedTasks) => {
    set({ tasks: reorderedTasks });
    try {
      await db.transaction('rw', db.tasks, async () => {
        await db.tasks.clear();
        await db.tasks.bulkAdd(reorderedTasks);
      });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    }
  }
}));

// Auto-hydrate from DB when the store is first imported
useStore.getState().loadFromDB();
