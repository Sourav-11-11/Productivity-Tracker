import React, { useState, useRef, useEffect } from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { Trash2 } from 'lucide-react';

interface RichTextEditorProps {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  onDelete: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  noteId,
  initialTitle,
  initialContent,
  onDelete,
}) => {
  const { updateNote, syncToCloud } = useNotesStore();
  
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize contentEditable with initial content
  useEffect(() => {
    if (contentRef.current && initialContent) {
      if (contentRef.current.innerHTML !== initialContent) {
        contentRef.current.innerHTML = initialContent;
      }
      setContent(initialContent);
    }
  }, [initialContent, noteId]);

  // Auto-save debounce
  useEffect(() => {
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
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Editor Header */}
      <div className="flex items-center gap-4 py-8 max-w-prose mx-auto w-full group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-4xl font-bold bg-transparent text-[#FAFAFA] placeholder-[#525252] outline-none"
          placeholder="Untitled Note"
        />
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {isSaving ? (
            <span className="text-xs text-[#525252] animate-pulse">Saving...</span>
          ) : (
            <span className="text-xs text-[#525252]">Saved</span>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-[#525252] hover:text-red-400 transition-colors"
            title="Delete Note"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={contentRef}
        contentEditable
        onInput={(e) => setContent(e.currentTarget.innerHTML)}
        suppressContentEditableWarning
        className="flex-1 overflow-auto bg-transparent focus:outline-none leading-relaxed max-w-prose mx-auto w-full text-lg text-[#A3A3A3] pb-32"
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
