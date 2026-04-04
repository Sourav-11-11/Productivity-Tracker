import { create } from 'zustand';
import { db } from '../db/db';
import type { Folder, Note } from '../db/db';

interface NotesStore {
  folders: Folder[];
  notes: Note[];
  syncInProgress: boolean;

  // Actions
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addNote: (folderId: string, title: string, content?: string) => Promise<void>;
  updateNote: (noteId: string, title: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  loadFromDB: () => Promise<void>;
  syncToCloud: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotesStore = create<NotesStore>((set, get) => ({
  folders: [],
  notes: [],
  syncInProgress: false,

  // Load all data from Dexie
  loadFromDB: async () => {
    try {
      const folders = await db.folders.toArray();
      const notes = await db.notes.toArray();
      set({ folders, notes });
    } catch (error) {
      console.error('Error loading from Dexie:', error);
    }
  },

  // Add a new folder
  addFolder: async (name: string) => {
    try {
      const id = `folder_${Date.now()}`;
      const folder: Folder = {
        id,
        name,
        updatedAt: Date.now(),
      };

      await db.folders.add(folder);
      const { folders } = get();
      set({ folders: [...folders, folder] });
    } catch (error) {
      console.error('Error adding folder:', error);
      throw error;
    }
  },

  // Delete a folder and all its notes
  deleteFolder: async (folderId: string) => {
    try {
      // Delete all notes in this folder
      const notesToDelete = get().notes.filter((n) => n.folderId === folderId);
      for (const note of notesToDelete) {
        await db.notes.delete(note.id);
      }

      // Delete the folder
      await db.folders.delete(folderId);

      const { folders, notes } = get();
      set({
        folders: folders.filter((f) => f.id !== folderId),
        notes: notes.filter((n) => n.folderId !== folderId),
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  // Add a new note
  addNote: async (folderId: string, title: string, content = '') => {
    try {
      const id = `note_${Date.now()}`;
      const note: Note = {
        id,
        folderId,
        title,
        content,
        updatedAt: Date.now(),
      };

      await db.notes.add(note);
      const { notes } = get();
      set({ notes: [...notes, note] });
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  // Update an existing note
  updateNote: async (noteId: string, title: string, content: string) => {
    try {
      const updatedNote: Note = {
        ...(await db.notes.get(noteId))!,
        title,
        content,
        updatedAt: Date.now(),
      };

      await db.notes.put(updatedNote);
      const { notes } = get();
      set({
        notes: notes.map((n) => (n.id === noteId ? updatedNote : n)),
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId: string) => {
    try {
      await db.notes.delete(noteId);
      const { notes } = get();
      set({ notes: notes.filter((n) => n.id !== noteId) });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  // Sync with cloud (MongoDB)
  syncToCloud: async () => {
    try {
      set({ syncInProgress: true });

      const { folders, notes } = get();

      const response = await fetch(`${API_BASE}/notes/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folders,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Update local Dexie with cloud data
        const { folders: cloudFolders, notes: cloudNotes } = result.data;

        // Upsert folders
        await db.folders.bulkPut(cloudFolders);

        // Upsert notes
        await db.notes.bulkPut(cloudNotes);

        set({
          folders: cloudFolders,
          notes: cloudNotes,
        });
      }

      console.log('✅ Sync successful');
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      set({ syncInProgress: false });
    }
  },
}));

// Auto-sync on app load
export const initializeNotesSync = async () => {
  const store = useNotesStore.getState();
  await store.loadFromDB();
  await store.syncToCloud();
};

// Setup auto-sync interval (every 60 seconds)
export const startAutoSync = () => {
  const interval = setInterval(async () => {
    const store = useNotesStore.getState();
    await store.syncToCloud();
  }, 60000); // 60 seconds

  return () => clearInterval(interval);
};
