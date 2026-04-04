import React, { useState, useMemo } from 'react';
import { useNotesStore, initializeNotesSync, startAutoSync } from '../store/useNotesStore';
import { Plus } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { useToast, ToastContainer } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Notes: React.FC = () => {
  const { folders, notes, addFolder, deleteFolder, addNote, deleteNote, syncToCloud, deletingNoteId, deletingFolderId } = useNotesStore();
  const { toasts, addToast, removeToast } = useToast();
  
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'note' | 'folder'; id: string } | null>(null);

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
      addToast('Folder created successfully', 'success');
    } catch (error) {
      console.error('Failed to create folder:', error);
      addToast('Failed to create folder', 'error');
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteName.trim() || !selectedFolderId) return;
    try {
      await addNote(selectedFolderId, newNoteName);
      setNewNoteName('');
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
      addToast('Folder and all its notes deleted successfully', 'success');
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
      await syncToCloud();
      addToast('Note deleted successfully', 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      addToast('Failed to delete note', 'error');
      setConfirmDelete(null);
    }
  };

  if (selectedFolderId) {
    return (
      <>
        <div className="h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col font-sans overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#141414]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedFolderId(null);
                  setSelectedNoteId(null);
                  setSearchQuery('');
                }}
                className="flex items-center gap-2 text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors"
                title="Back to folders"
              >
                <div className="w-4 h-[1px] bg-current" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="w-px h-4 bg-[#262626]"></div>
              <h1 className="text-lg font-medium text-[#FAFAFA] truncate max-w-sm">{selectedFolder?.name}</h1>
            </div>
            <button
              onClick={() => setConfirmDelete({ type: 'folder', id: selectedFolderId })}
              disabled={deletingFolderId === selectedFolderId}
              className="text-sm text-[#525252] hover:text-red-400 disabled:opacity-50 transition-colors p-2"
            >
              Delete Folder
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-72 flex-shrink-0 bg-[#0A0A0A] flex flex-col border-r border-[#141414]">
              <div className="p-4 border-b border-[#141414]">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] text-[#FAFAFA] border border-[#262626] rounded text-sm focus:outline-none focus:border-[#525252] transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="mb-4">
                  {!showNewNoteInput ? (
                    <button
                      onClick={() => setShowNewNoteInput(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-[#141414] border border-[#262626] text-[#A3A3A3] rounded text-sm transition-colors"
                    >
                      <Plus size={16} />
                      New Note
                    </button>
                  ) : (
                    <div className="space-y-2 bg-[#141414] p-3 rounded border border-[#262626]">
                      <input
                        type="text"
                        placeholder="Note title..."
                        value={newNoteName}
                        onChange={(e) => setNewNoteName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                        className="w-full px-2 py-1 bg-transparent text-[#FAFAFA] border-b border-[#262626] focus:border-[#525252] text-sm focus:outline-none"
                        autoFocus
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
                          }}
                          className="flex-1 px-2 py-1 bg-transparent border border-[#262626] text-[#A3A3A3] rounded text-xs hover:text-[#FAFAFA] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedNoteId === note.id
                        ? 'bg-[#141414] text-[#FAFAFA]'
                        : 'text-[#A3A3A3] hover:bg-[#141414]'
                    }`}
                  >
                    <p className="font-medium truncate">{note.title}</p>
                    <p className={`text-xs mt-1 truncate ${selectedNoteId === note.id ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}>{note.content.replace(/<[^>]*>/g, '') || 'Empty'}</p>
                  </button>
                ))}
                </div>
              </div>
            </div>

            <div className="flex-1 bg-[#0A0A0A] overflow-hidden flex flex-col">
              {selectedNote ? (
                <div className="h-full flex-1 p-4 flex flex-col">
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
                  <p>Select a note to edit.</p>
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

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] p-8 md:p-12 font-sans selection:bg-[#FAFAFA] selection:text-[#0A0A0A]">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className="flex flex-col items-start gap-4">
            <div className="flex items-center justify-between w-full border-b border-[#262626] pb-6">
              <h1 className="text-2xl font-medium tracking-tight text-[#FAFAFA]">Folders</h1>
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
                    className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#FAFAFA] rounded text-sm focus:ring-0 focus:outline-none focus:border-[#525252] w-48 transition-colors"
                    autoFocus
                  />
                  <button onClick={handleCreateFolder} className="px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] font-medium rounded text-sm hover:bg-[#E5E5E5] transition-colors">Create</button>
                  <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }} className="px-4 py-2 text-[#A3A3A3] text-sm hover:text-[#FAFAFA] transition-colors">Cancel</button>
                </div>
              )}
            </div>
          </header>

          {folders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="group relative flex flex-col items-start p-6 bg-[#141414] border border-[#141414] hover:bg-[#1A1A1A] hover:border-[#262626] rounded text-left transition-all"
                >
                  <h3 className="text-xl font-medium text-[#FAFAFA] tracking-tight truncate w-full">{folder.name}</h3>
                  <p className="text-sm text-[#A3A3A3] mt-2">
                    {notes.filter((n) => n.folderId === folder.id).length} notes
                  </p>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: 'folder', id: folder.id });
                    }}
                    disabled={deletingFolderId === folder.id}
                    className="absolute top-6 right-4 opacity-0 group-hover:opacity-100 text-sm text-[#525252] hover:text-red-400 disabled:opacity-50 transition-all p-2"
                  >
                    Delete
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#525252] text-sm">
              <p>No folders. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === 'note' ? 'Delete Note' : 'Delete Folder'}
          message="This action cannot be undone."
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
