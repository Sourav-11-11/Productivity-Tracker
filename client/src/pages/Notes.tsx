import React, { useState, useMemo, useEffect } from 'react';
import { useNotesStore, initializeNotesSync, startAutoSync } from '../store/useNotesStore';
import { Plus, Search, X, Edit2, Check, Pin, PinOff } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { useToast, ToastContainer } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Notes: React.FC = () => {
  const { folders, notes, addFolder, updateFolder, deleteFolder, addNote, deleteNote, syncToCloud, deletingNoteId, deletingFolderId } = useNotesStore();
  const { toasts, addToast, removeToast } = useToast();
  
  // Folder selection & quick note input
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Folder creation & renaming
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState('');
  
  // Note creation
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [quickNoteContent, setQuickNoteContent] = useState('');
  
  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'note' | 'folder'; id: string } | null>(null);
  
  // Pinned notes state (from localStorage)
  const [pinnedNotes, setPinnedNotes] = useState<string[]>([]);

  React.useEffect(() => {
    initializeNotesSync();
    const stopAutoSync = startAutoSync();
    return stopAutoSync;
  }, []);

  // Load pinned notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pinnedNotes');
    if (stored) {
      try {
        setPinnedNotes(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse pinnedNotes from localStorage:', error);
        setPinnedNotes([]);
      }
    }
  }, []);

  // Save pinned notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pinnedNotes', JSON.stringify(pinnedNotes));
  }, [pinnedNotes]);

  const togglePinNote = (noteId: string) => {
    setPinnedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

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

  // Filter notes by local search (within folder) and separate into pinned & unpinned
  const filteredAndSortedNotes = useMemo(() => {
    const filtered = folderNotes.filter((n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate pinned and unpinned notes
    const pinned = filtered.filter((n) => pinnedNotes.includes(n.id));
    const unpinned = filtered.filter((n) => !pinnedNotes.includes(n.id));

    // Return pinned notes first, then unpinned
    return [...pinned, ...unpinned];
  }, [folderNotes, searchQuery, pinnedNotes]);

  // Global search across all notes
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const query = globalSearchQuery.toLowerCase();
    return notes.filter((n) =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    );
  }, [notes, globalSearchQuery]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await addFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
      await syncToCloud();
      addToast('Folder created successfully', 'success');
    } catch (error) {
      console.error('Failed to create folder:', error);
      addToast('Failed to create folder', 'error');
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!renamingFolderName.trim()) {
      setRenamingFolderId(null);
      setRenamingFolderName('');
      return;
    }
    try {
      await updateFolder(folderId, renamingFolderName);
      setRenamingFolderId(null);
      setRenamingFolderName('');
      await syncToCloud();
      addToast('Folder renamed successfully', 'success');
    } catch (error) {
      console.error('Failed to rename folder:', error);
      addToast('Failed to rename folder', 'error');
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteName.trim() || !selectedFolderId) return;
    try {
      await addNote(selectedFolderId, newNoteName, quickNoteContent);
      setNewNoteName('');
      setQuickNoteContent('');
      setShowNewNoteInput(false);
      await syncToCloud();
      addToast('Note created successfully', 'success');
    } catch (error) {
      console.error('Failed to create note:', error);
      addToast('Failed to create note', 'error');
    }
  };

  const handleDeleteFolder = async () => {
    if (confirmDelete?.type !== 'folder' || !confirmDelete?.id) return;
    const folderId = confirmDelete.id;
    try {
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        setSelectedNoteId(null);
      }
      await syncToCloud();
      addToast('Folder deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      addToast('Failed to delete folder', 'error');
      setConfirmDelete(null);
    }
  };

  const handleDeleteNote = async () => {
    if (confirmDelete?.type !== 'note' || !confirmDelete?.id) return;
    const noteId = confirmDelete.id;
    try {
      await deleteNote(noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
      // Remove from pinnedNotes if it was pinned
      setPinnedNotes((prev) => prev.filter((id) => id !== noteId));
      await syncToCloud();
      addToast('Note deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      addToast('Failed to delete note', 'error');
      setConfirmDelete(null);
    }
  };

  // Split View: Inside Folder
  if (selectedFolderId) {
    return (
      <>
        <div className="h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col font-sans overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#0A0A0A]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedFolderId(null);
                  setSelectedNoteId(null);
                  setSearchQuery('');
                  setGlobalSearchQuery('');
                }}
                className="flex items-center gap-2 text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors px-2 py-1 rounded hover:bg-[#141414]"
              >
                <X size={16} />
              </button>
              <div className="w-px h-6 bg-[#262626]"></div>
              <div>
                {renamingFolderId === selectedFolderId ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={renamingFolderName}
                      onChange={(e) => setRenamingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFolder(selectedFolderId);
                        if (e.key === 'Escape') {
                          setRenamingFolderId(null);
                          setRenamingFolderName('');
                        }
                      }}
                      className="px-2 py-1 bg-[#141414] text-[#FAFAFA] border border-[#262626] rounded text-sm focus:outline-none focus:border-[#525252]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameFolder(selectedFolderId)}
                      className="p-1 text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-lg font-medium text-[#FAFAFA]">{selectedFolder?.name}</h1>
                    <button
                      onClick={() => {
                        setRenamingFolderId(selectedFolderId);
                        setRenamingFolderName(selectedFolder?.name || '');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#525252] hover:text-[#A3A3A3] transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setConfirmDelete({ type: 'folder', id: selectedFolderId })}
              disabled={deletingFolderId === selectedFolderId}
              className="text-sm text-[#525252] hover:text-red-400 disabled:opacity-50 transition-colors px-3 py-1 rounded hover:bg-[#141414]"
            >
              Delete Folder
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar: Notes List */}
            <div className="w-80 flex-shrink-0 bg-[#0A0A0A] flex flex-col border-r border-[#262626]">
              {/* Search Bar */}
              <div className="p-4 border-b border-[#262626]">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#262626] rounded transition-all focus-within:border-[#525252]">
                  <Search size={16} className="text-[#525252]" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[#FAFAFA] placeholder-[#525252] text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Note Creation */}
              <div className="p-4 border-b border-[#262626] bg-[#0A0A0A]">
                {!showNewNoteInput ? (
                  <button
                    onClick={() => setShowNewNoteInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-[#141414] border border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] rounded text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Quick Note
                  </button>
                ) : (
                  <div className="space-y-2 bg-[#141414] p-3 rounded border border-[#262626]">
                    <input
                      type="text"
                      placeholder="Note title..."
                      value={newNoteName}
                      onChange={(e) => setNewNoteName(e.target.value)}
                      className="w-full px-2 py-1 bg-transparent text-[#FAFAFA] border-b border-[#262626] focus:border-[#525252] text-sm focus:outline-none placeholder-[#525252]"
                      autoFocus
                    />
                    <textarea
                      placeholder="Note preview..."
                      value={quickNoteContent}
                      onChange={(e) => setQuickNoteContent(e.target.value)}
                      className="w-full px-2 py-1 bg-transparent text-[#A3A3A3] border border-[#262626] focus:border-[#525252] text-xs rounded focus:outline-none placeholder-[#525252] resize-none h-16"
                    />
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCreateNote}
                        className="flex-1 px-2 py-1 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded text-xs hover:bg-[#E5E5E5] transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewNoteInput(false);
                          setNewNoteName('');
                          setQuickNoteContent('');
                        }}
                        className="flex-1 px-2 py-1 bg-transparent border border-[#262626] text-[#A3A3A3] rounded text-xs hover:text-[#FAFAFA] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes List - Pinned Notes First */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredAndSortedNotes.length > 0 ? (
                  filteredAndSortedNotes.map((note) => {
                    const isPinned = pinnedNotes.includes(note.id);
                    return (
                      <button
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors group ${
                          selectedNoteId === note.id
                            ? 'bg-[#141414] text-[#FAFAFA] border border-[#262626]'
                            : 'text-[#A3A3A3] hover:bg-[#141414] border border-transparent hover:border-[#262626]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{note.title || 'Untitled'}</p>
                            <p className={`text-xs mt-1 truncate ${selectedNoteId === note.id ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}>
                              {note.content.replace(/<[^>]*>/g, '') || 'Empty note'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinNote(note.id);
                            }}
                            className="flex-shrink-0 p-1 text-[#525252] hover:text-[#FAFAFA] opacity-0 group-hover:opacity-100 transition-all"
                            title={isPinned ? 'Unpin note' : 'Pin note'}
                          >
                            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                          </button>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[#525252] text-xs">
                    {searchQuery ? 'No notes found.' : 'No notes yet. Create one!'}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Note Editor */}
            <div className="flex-1 bg-[#0A0A0A] overflow-hidden flex flex-col">
              {selectedNote ? (
                <div className="h-full flex-1 flex flex-col">
                  <RichTextEditor
                    noteId={selectedNote.id}
                    initialTitle={selectedNote.title}
                    initialContent={selectedNote.content}
                    onDelete={() => setConfirmDelete({ type: 'note', id: selectedNote.id })}
                    isDeleting={deletingNoteId === selectedNote.id}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#525252] text-sm">
                  <div className="text-center space-y-2">
                    <p>Select a note to edit</p>
                    <p className="text-xs text-[#525252]">or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {confirmDelete && (
          <ConfirmDialog
            title={confirmDelete.type === 'note' ? 'Delete Note' : 'Delete Folder'}
            message={
              confirmDelete.type === 'note'
                ? 'This note will be permanently deleted.'
                : 'This folder and all its notes will be permanently deleted.'
            }
            confirmText="Delete"
            isLoading={confirmDelete.type === 'note' ? deletingNoteId === confirmDelete.id : deletingFolderId === confirmDelete.id}
            onConfirm={confirmDelete.type === 'note' ? handleDeleteNote : handleDeleteFolder}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // Folders Dashboard with Global Search
  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] p-8 md:p-12 font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A]">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="border-b border-[#262626] pb-6">
            <h1 className="text-3xl font-medium tracking-tight text-[#FAFAFA] mb-4">Folders</h1>
            
            {/* Global Search */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#141414] border border-[#262626] rounded-lg transition-all focus-within:border-[#525252] max-w-2xl">
              <Search size={18} className="text-[#525252]" />
              <input
                type="text"
                placeholder="Search all notes..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#FAFAFA] placeholder-[#525252] text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Global Search Results */}
          {globalSearchQuery && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-medium text-[#A3A3A3] mb-4">
                  {globalSearchResults.length} result{globalSearchResults.length !== 1 ? 's' : ''} found
                </h2>
                <div className="space-y-2">
                  {globalSearchResults.map((note) => {
                    const folder = folders.find((f) => f.id === note.folderId);
                    return (
                      <button
                        key={note.id}
                        onClick={() => {
                          setSelectedFolderId(note.folderId);
                          setSelectedNoteId(note.id);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-3 bg-[#141414] border border-[#262626] hover:border-[#525252] rounded-lg transition-colors"
                      >
                        <p className="text-sm font-medium text-[#FAFAFA]">{note.title || 'Untitled'}</p>
                        <p className="text-xs text-[#A3A3A3] mt-1">
                          {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                        <p className="text-xs text-[#525252] mt-2">
                          in <span className="text-[#A3A3A3]">{folder?.name || 'Unknown'}</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Folder Creation Button */}
          {!globalSearchQuery && (
            <div className="flex items-center justify-between">
              <div></div>
              {!showNewFolderInput ? (
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded text-sm hover:bg-[#E5E5E5] transition-colors"
                >
                  <Plus size={16} />
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
                    className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#FAFAFA] rounded text-sm focus:ring-0 focus:outline-none focus:border-[#525252] w-48 transition-colors placeholder-[#525252]"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded text-sm hover:bg-[#E5E5E5] transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 text-[#A3A3A3] text-sm hover:text-[#FAFAFA] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Folders Grid (4 columns) */}
          {!globalSearchQuery && (
            <>
              {folders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative flex flex-col items-start p-5 bg-[#141414] border border-[#262626] hover:bg-[#1A1A1A] hover:border-[#525252] rounded-lg text-left transition-all"
                    >
                      <button
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="flex-1 w-full text-left"
                      >
                        <h3 className="text-lg font-medium text-[#FAFAFA] tracking-tight truncate w-full">
                          {folder.name}
                        </h3>
                        <p className="text-sm text-[#A3A3A3] mt-2">
                          {notes.filter((n) => n.folderId === folder.id).length} note
                          {notes.filter((n) => n.folderId === folder.id).length !== 1 ? 's' : ''}
                        </p>
                      </button>

                      {/* Actions */}
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolderId(folder.id);
                            setRenamingFolderName(folder.name);
                          }}
                          className="p-2 text-[#525252] hover:text-[#A3A3A3] hover:bg-[#262626] rounded transition-all"
                          title="Rename folder"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ type: 'folder', id: folder.id });
                          }}
                          disabled={deletingFolderId === folder.id}
                          className="p-2 text-[#525252] hover:text-red-400 hover:bg-[#262626] disabled:opacity-50 rounded transition-all"
                          title="Delete folder"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Rename Inline */}
                      {renamingFolderId === folder.id && (
                        <div className="absolute inset-0 bg-[#141414] border border-[#262626] rounded-lg p-5 flex flex-col gap-2 z-10">
                          <input
                            type="text"
                            value={renamingFolderName}
                            onChange={(e) => setRenamingFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFolder(folder.id);
                              if (e.key === 'Escape') {
                                setRenamingFolderId(null);
                                setRenamingFolderName('');
                              }
                            }}
                            className="px-2 py-1 bg-transparent text-[#FAFAFA] border-b border-[#262626] focus:border-[#525252] text-sm focus:outline-none placeholder-[#525252]"
                            autoFocus
                          />
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleRenameFolder(folder.id)}
                              className="flex-1 px-2 py-1 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded text-xs hover:bg-[#E5E5E5] transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setRenamingFolderId(null);
                                setRenamingFolderName('');
                              }}
                              className="flex-1 px-2 py-1 bg-transparent border border-[#262626] text-[#A3A3A3] rounded text-xs hover:text-[#FAFAFA] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-[#525252] text-sm">
                  <p>{showNewFolderInput ? '' : 'No folders yet. Create one to get started.'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === 'note' ? 'Delete Note' : 'Delete Folder'}
          message={
            confirmDelete.type === 'note'
              ? 'This note will be permanently deleted.'
              : 'This folder and all its notes will be permanently deleted.'
          }
          confirmText="Delete"
          isLoading={confirmDelete.type === 'note' ? deletingNoteId === confirmDelete.id : deletingFolderId === confirmDelete.id}
          onConfirm={confirmDelete.type === 'note' ? handleDeleteNote : handleDeleteFolder}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default Notes;

