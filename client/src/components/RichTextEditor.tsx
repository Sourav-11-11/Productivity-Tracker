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
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
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

  // Auto-save debounce: 500ms
  useEffect(() => {
    if (isDeleting) return;

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
  }, [title, content, noteId, updateNote, syncToCloud, isDeleting]);

  // Toolbar command handlers
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleHeading = (level: 'h1' | 'h2' | 'h3') => {
    execCommand('formatBlock', `<${level}>`);
  };

  const handleBold = () => {
    execCommand('bold');
  };

  const handleItalic = () => {
    execCommand('italic');
  };

  const handleBulletList = () => {
    execCommand('insertUnorderedList');
  };

  const handleCodeBlock = () => {
    execCommand('formatBlock', '<pre>');
  };

  const handleLink = () => {
    if (linkUrl.trim()) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0A]">
      {/* Title Section */}
      <div className="flex items-center justify-between gap-4 px-6 pt-8 pb-4 border-b border-[#262626] shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-3xl font-semibold tracking-tight bg-transparent text-[#FAFAFA] placeholder-[#525252] outline-none"
          placeholder="Note title..."
        />
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-[#A3A3A3] animate-pulse">Saving...</span>}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="text-xs font-medium text-[#A3A3A3] hover:text-[#FAFAFA] disabled:opacity-50 transition-colors px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Minimal Toolbar */}
      <div className="flex items-center gap-1 px-6 py-3 bg-[#0A0A0A] border-b border-[#262626] flex-wrap">
        {/* Headings dropdown */}
        <div className="relative group">
          <button
            className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
            title="Heading"
          >
            H
          </button>
          <div className="absolute left-0 hidden group-hover:flex flex-col bg-[#141414] border border-[#262626] rounded shadow-lg z-10 py-1">
            <button
              onClick={() => handleHeading('h1')}
              className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] whitespace-nowrap"
            >
              Heading 1
            </button>
            <button
              onClick={() => handleHeading('h2')}
              className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] whitespace-nowrap"
            >
              Heading 2
            </button>
            <button
              onClick={() => handleHeading('h3')}
              className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] whitespace-nowrap"
            >
              Heading 3
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[#262626] mx-1" />

        {/* Bold */}
        <button
          onClick={handleBold}
          className="px-3 py-1 text-sm font-bold text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        {/* Italic */}
        <button
          onClick={handleItalic}
          className="px-3 py-1 text-sm italic text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[#262626] mx-1" />

        {/* Bullet List */}
        <button
          onClick={handleBulletList}
          className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
          title="Bullet List"
        >
          •
        </button>

        {/* Code Block */}
        <button
          onClick={handleCodeBlock}
          className="px-3 py-1 text-sm font-mono text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
          title="Code Block"
        >
          &lt;&gt;
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[#262626] mx-1" />

        {/* Link */}
        <button
          onClick={() => setShowLinkModal(!showLinkModal)}
          className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#141414] rounded transition-colors"
          title="Link"
        >
          🔗
        </button>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="flex items-center gap-2 px-6 py-2 bg-[#141414] border-b border-[#262626]">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLink();
              if (e.key === 'Escape') {
                setShowLinkModal(false);
                setLinkUrl('');
              }
            }}
            placeholder="Enter URL..."
            autoFocus
            className="flex-1 px-3 py-1 text-sm bg-[#0A0A0A] border border-[#262626] rounded text-[#FAFAFA] placeholder-[#525252] outline-none focus:border-[#A3A3A3]"
          />
          <button
            onClick={handleLink}
            className="px-3 py-1 text-sm font-medium text-[#FAFAFA] bg-[#262626] hover:bg-[#333333] rounded transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowLinkModal(false);
              setLinkUrl('');
            }}
            className="px-3 py-1 text-sm text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 w-full max-w-prose mx-auto">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          className="outline-none text-lg leading-relaxed text-[#FAFAFA] focus:outline-none selection:bg-[#262626] selection:text-[#FAFAFA]"
          style={{
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          data-placeholder="Start writing..."
        />
      </div>
    </div>
  );
};

export default RichTextEditor;


