import React, { useState, useRef, useEffect } from 'react';
import { useNotesStore } from '../store/useNotesStore';

interface RichTextEditorProps {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  onDelete: () => void;
  isDeleting?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  noteId,
  initialTitle,
  initialContent,
  onDelete,
  isDeleting = false,
}) => {
  const { updateNote, syncToCloud } = useNotesStore();
  
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize contentEditable with initial content when note changes
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    if (contentRef.current && contentRef.current.innerHTML !== initialContent) {
      contentRef.current.innerHTML = initialContent;
    }
  }, [noteId, initialTitle, initialContent]);

  // Auto-save debounce
  useEffect(() => {
    if (isDeleting) return; // don't auto-save if we are purposely deleting
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (title.trim() || content.trim()) {
        try {
          setIsSaving(true);
          await updateNote(noteId, title, content);
          await syncToCloud();
        } catch (error) {
          console.error('Failed to save note:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, noteId, updateNote, syncToCloud]);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] w-full md:max-w-4xl mx-auto border border-[#262626] rounded-lg shadow-sm m-4 lg:my-6 lg:mx-auto">
      {/* Editor Header */}
      <div className="flex items-center justify-between gap-4 group border-b border-[#141414] p-4 bg-[#0F0F0F] rounded-t-lg shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-xl font-medium tracking-tight bg-transparent text-[#FAFAFA] placeholder-[#525252] outline-none"
          placeholder="Note title..."
        />
        <div className="flex items-center gap-3 transition-opacity">
          {isSaving ? (
            <span className="text-xs text-[#A3A3A3] animate-pulse">Saving...</span>
          ) : (
            <span className="text-xs text-[#525252]">Saved</span>
          )}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="text-xs font-medium text-[#525252] hover:text-red-400 hover:bg-[#141414] disabled:opacity-50 transition-colors px-3 py-1.5 rounded"
            title="Delete Note"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={contentRef}
        contentEditable
        onInput={(e) => setContent(e.currentTarget.innerHTML)}
        suppressContentEditableWarning
        className="flex-1 overflow-y-auto bg-transparent focus:outline-none leading-relaxed w-full text-sm text-[#A3A3A3] p-5 selection:bg-[#FAFAFA] selection:text-[#0A0A0A]"
        style={{
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        data-placeholder="Start writing..."
      />
    </div>
  );
};

export default RichTextEditor;
