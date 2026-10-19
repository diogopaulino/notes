import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Folder, Note } from '../types';
import { formatEditorDate } from '../utils';
import {
  IconAa,
  IconChecklist,
  IconCompose,
  IconEllipsis,
  IconLock,
  IconMarkup,
  IconPaperclip,
  IconSearch,
  IconShare,
  IconTable,
} from '../icons';

interface EditorProps {
  note: Note | null;
  folders: Folder[];
  isTrash: boolean;
  unlocked: boolean;
  search: string;
  onSearch: (q: string) => void;
  onNewNote: () => void;
  onUnlock: () => void;
  onChange: (html: string) => void;
  onTogglePin: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onDuplicate: () => void;
  onMove: (folderId: string) => void;
  onExport: (format: 'txt' | 'md' | 'html') => void;
  onInsertImage: () => void;
}

export function Editor({
  note,
  folders,
  isTrash,
  unlocked,
  search,
  onSearch,
  onNewNote,
  onUnlock,
  onChange,
  onTogglePin,
  onToggleLock,
  onDelete,
  onRestore,
  onPermanentDelete,
  onDuplicate,
  onMove,
  onExport,
  onInsertImage,
}: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);
  const [showFormat, setShowFormat] = useState(false);

  useEffect(() => {
    if (!note || !ref.current) return;
    if (lastId.current !== note.id) {
      ref.current.innerHTML = note.content || '<div><br></div>';
      lastId.current = note.id;
      return;
    }
    // Sync external updates (image insert, etc.) when not actively typing
    if (document.activeElement !== ref.current) {
      ref.current.innerHTML = note.content || '<div><br></div>';
    }
  }, [note]);

  function run(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function insertChecklist() {
    run(
      'insertHTML',
      '<div class="checklist-item"><input type="checkbox" contenteditable="false"> Item</div><div><br></div>',
    );
  }

  function insertTable() {
    run(
      'insertHTML',
      `<table class="note-table"><tr><th></th><th></th></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table><div><br></div>`,
    );
  }

  const lockedView = Boolean(note?.locked && !unlocked && !isTrash);

  return (
    <section className="editor">
      <div className="editor-chrome">
        <button
          type="button"
          className="tool-btn accent-btn"
          title="New Note"
          disabled={isTrash}
          onClick={onNewNote}
        >
          <IconCompose />
        </button>

        {!isTrash && (
          <div className="format-pill">
            <div className="format-menu">
              <ToolBtn
                title="Format"
                onClick={() => setShowFormat((v) => !v)}
                active={showFormat}
              >
                <IconAa />
              </ToolBtn>
              {showFormat && (
                <div className="format-popover">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('formatBlock', 'h1'); }}>
                    Title
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('formatBlock', 'h2'); }}>
                    Heading
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('formatBlock', 'div'); }}>
                    Body
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('formatBlock', 'pre'); }}>
                    Monospaced
                  </button>
                  <hr />
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('bold'); }}>
                    Bold
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('italic'); }}>
                    Italic
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('underline'); }}>
                    Underline
                  </button>
                  <hr />
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('insertUnorderedList'); }}>
                    Bulleted List
                  </button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); run('insertOrderedList'); }}>
                    Numbered List
                  </button>
                </div>
              )}
            </div>
            <ToolBtn title="Checklist" onClick={insertChecklist}>
              <IconChecklist />
            </ToolBtn>
            <ToolBtn title="Table" onClick={insertTable}>
              <IconTable />
            </ToolBtn>
            <ToolBtn title="Add Photo" onClick={onInsertImage}>
              <IconPaperclip />
            </ToolBtn>
            <ToolBtn title="Markup" onClick={() => undefined}>
              <IconMarkup />
            </ToolBtn>
          </div>
        )}

        <div className="editor-chrome-right">
          {isTrash && note ? (
            <>
              <button type="button" className="text-btn" onClick={onRestore}>
                Recover
              </button>
              <button
                type="button"
                className="text-btn danger"
                onClick={onPermanentDelete}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button type="button" className="tool-btn" title="Share">
                <IconShare />
              </button>
              <div className="toolbar-menu">
                <button type="button" className="tool-btn" title="More">
                  <IconEllipsis />
                </button>
                {note && (
                  <div className="toolbar-dropdown">
                    <button type="button" onClick={onTogglePin}>
                      {note.pinned ? 'Unpin' : 'Pin Note'}
                    </button>
                    <button type="button" onClick={onToggleLock}>
                      {note.locked ? 'Remove Lock' : 'Lock Note'}
                    </button>
                    <button type="button" onClick={onDuplicate}>
                      Duplicate
                    </button>
                    <div className="dropdown-label">Move To</div>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => onMove(folder.id)}
                        disabled={folder.id === note.folderId}
                      >
                        {folder.name}
                      </button>
                    ))}
                    <div className="dropdown-label">Export</div>
                    <button type="button" onClick={() => onExport('txt')}>
                      Plain Text
                    </button>
                    <button type="button" onClick={() => onExport('md')}>
                      Markdown
                    </button>
                    <button type="button" onClick={() => onExport('html')}>
                      HTML
                    </button>
                    <button type="button" className="danger" onClick={onDelete}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="editor-search">
            <IconSearch className="editor-search-icon" />
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search"
            />
          </div>
        </div>
      </div>

      {!note ? (
        <div className="editor-empty">
          <div className="editor-placeholder">No Note Selected</div>
        </div>
      ) : (
        <>
          <div className="editor-date">{formatEditorDate(note.updatedAt)}</div>

          {note.tags.length > 0 && (
            <div className="editor-tags">
              {note.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {lockedView ? (
            <div className="locked-panel">
              <IconLock size={28} />
              <h2>This note is locked</h2>
              <p>Enter the password to view its contents.</p>
              <button type="button" className="primary-btn" onClick={onUnlock}>
                Unlock
              </button>
            </div>
          ) : (
            <div
              ref={ref}
              className="editor-body"
              contentEditable={!isTrash}
              suppressContentEditableWarning
              spellCheck
              onInput={() => {
                if (ref.current) onChange(ref.current.innerHTML);
              }}
              onClick={(e) => {
                const t = e.target as HTMLElement;
                if (
                  t.tagName === 'INPUT' &&
                  t.getAttribute('type') === 'checkbox'
                ) {
                  requestAnimationFrame(() => {
                    if (ref.current) onChange(ref.current.innerHTML);
                  });
                }
              }}
            />
          )}
        </>
      )}
    </section>
  );
}

function ToolBtn({
  title,
  onClick,
  children,
  active,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`tool-btn ${active ? 'active' : ''}`}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
