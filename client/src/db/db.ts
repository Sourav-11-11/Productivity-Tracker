import Dexie from 'dexie';
import type { Table } from 'dexie';

export type TaskCategory = 'DSA' | 'Placement' | 'Personal';

export interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  category: TaskCategory;
  completed: boolean;
  createdAt: number;
}

export interface DailyLog {
  id: string; // format: 'YYYY-MM-DD'
  date: string;
  notes: string;
}

export type Folder = {
  id: string;
  name: string;
  updatedAt: number;
};

export type Note = {
  id: string;
  folderId: string;
  title: string;
  content: string; // HTML content from TipTap
  updatedAt: number;
};

export class LifeOSDatabase extends Dexie {
  // Tell TypeScript about the tables and types
  tasks!: Table<Task, string>;
  dailyLogs!: Table<DailyLog, string>;
  folders!: Table<Folder, string>;
  notes!: Table<Note, string>;

  constructor() {
    super('lifeOS');
    
    // Version 1 of the database schema (backward compatible)
    this.version(1).stores({
      // First item is the primary key, others are indexed for fast querying
      tasks: 'id, category, completed, createdAt',
      dailyLogs: 'id, date'
    });

    // Version 2 - Add folders and notes for Notes system
    this.version(2).stores({
      tasks: 'id, category, completed, createdAt',
      dailyLogs: 'id, date',
      folders: 'id, updatedAt',
      notes: 'id, folderId, updatedAt'
    });
  }
}

// Export a singleton instance
export const db = new LifeOSDatabase();
