import React, { useState, useMemo } from 'react';
import { useNotesStore, initializeNotesSync, startAutoSync } from '../store/useNotesStore';
import { FolderPlus, Plus, ChevronLeft, Trash2 } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';

export const Notes: React.FC = () => {
  const { folders, notes, addFolder, deleteFolder, addNote, deleteNote, syncToCloud } = useNotesStore();
  
  // UI state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);

  // Initialize on mount
  React.useEffect(() => {
    initializeNotesSync();
    const stopAutoSync = startAutoSync();
    return stopAutoSync;
  }, []);

  const selectedFolder = useMemo(() => {
    return selectedFolderId ? folders.find((f) => f.id === selectedFolderId) : null;
  }, [selectedFolderId, folders]);

  const selectedNote = useMemo(() => {
    return selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : null;
  }, [selectedNoteId, notes]);

  const folderNotes = useMemo(() => {
    if (!selectedFolderId) return [];
    return notes.filter((n) => n.folderId === selectedFolderId);
  }, [selectedFolderId, notes]);

  const filteredNotes = useMemo(() => {
    return folderNotes.filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folderNotes, searchQuery]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await addFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
      await syncToCloud();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteName.trim() || !selectedFolderId) return;
    try {
      await addNote(selectedFolderId, newNoteName);
      setNewNoteName('');
      setShowNewNoteInput(false);
      await syncToCloud();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Delete this folder and all its notes?')) {
      try {
        await deleteFolder(folderId);
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
          setSelectedNoteId(null);
        }
        await syncToCloud();
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Delete this note?')) {
      try {
        await deleteNote(noteId);
        if (selectedNoteId === noteId) {
          setSelectedNoteId(null);
        }
        await syncToCloud();
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  if (selectedFolderId) {
    return (
      <div className="h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col font-sans overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-[#141414]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setSelectedFolderId(null);
                setSelectedNoteId(null);
                setSearchQuery('');
              }}
              className="flex items-center gap-2 text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Folders</span>
            </button>
            <div className="w-px h-4 bg-[#262626]"></div>
            <h1 className="text-lg font-medium tracking-tight text-[#FAFAFA]">{selectedFolder?.name}</h1>
          </div>
          <button
            onClick={() => handleDeleteFolder(selectedFolderId)}
            className="text-[#525252] hover:text-red-400 transition-colors p-2"
            title="Delete Folder"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Notes List */}
          <div className="w-72 flex-shrink-0 bg-[#0A0A0A] border-r border-[#141414] flex flex-col">
            <div className="p-4 border-b border-[#141414]">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#141414] text-[#FAFAFA] border border-[#262626] rounded focus:outline-none focus:border-[#525252] text-sm transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <div className="mb-4">
                {!showNewNoteInput ? (
                  <button
                    onClick={() => setShowNewNoteInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-[#141414] border border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] rounded text-sm transition-colors"
                  >
                    <Plus size={16} />
                    New Note
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Note title..."
                      value={newNoteName}
                      onChange={(e) => setNewNoteName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                      className="w-full px-3 py-2 bg-[#141414] text-[#FAFAFA] border border-[#262626] rounded focus:outline-none focus:border-[#525252] text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateNote}
                        className="flex-1 px-3 py-1.5 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded text-xs transition-colors hover:bg-[#E5E5E5]"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewNoteInput(false);
                          setNewNoteName('');
                        }}
                        className="flex-1 px-3 py-1.5 bg-transparent border border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full text-left px-4 py-3 rounded transition-colors block group ${
                    selectedNoteId === note.id
                      ? 'bg-[#141414] text-[#FAFAFA]'
                      : 'text-[#A3A3A3] hover:bg-[#141414] hover:text-[#FAFAFA]'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{note.title}</p>
                  <p className="text-xs text-[#525252] truncate mt-1 group-hover:text-[#A3A3A3] transition-colors">{note.content.replace(/<[^>]*>/g, '') || 'Empty note'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1 bg-[#0A0A0A] overflow-y-auto">
            {selectedNote ? (
              <RichTextEditor
                noteId={selectedNote.id}
                initialTitle={selectedNote.title}
                initialContent={selectedNote.content}
                onDelete={() => handleDeleteNote(selectedNote.id)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-[#525252] text-sm">
                <p>Select a note to read or edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Folder Grid View
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-6">
          <h1 className="text-2xl font-medium tracking-tight">Notes</h1>
          {!showNewFolderInput ? (
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded hover:bg-[#E5E5E5] transition-colors text-sm"
            >
              <FolderPlus size={16} />
              New Folder
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="px-4 py-2 bg-[#141414] text-[#FAFAFA] border border-[#262626] rounded focus:outline-none focus:border-[#525252] transition-colors text-sm"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded hover:bg-[#E5E5E5] transition-colors text-sm"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Folders Grid */}
        {folders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className="group relative bg-[#141414] border border-[#141414] hover:bg-[#1A1A1A] hover:border-[#262626] rounded p-6 transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col justify-between aspect-square"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-medium tracking-tight text-[#FAFAFA] leading-tight line-clamp-3">{folder.name}</h3>
                </div>
                <div className="flex items-center justify-between text-sm text-[#A3A3A3] mt-auto">
                  <span>{notes.filter((n) => n.folderId === folder.id).length} notes</span>
                </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#525252] hover:text-red-400 transition-all z-10"
                >
                  <Trash2 size={16} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-[#525252] text-sm">
            <p>No folders yet. Create one to organize your notes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
