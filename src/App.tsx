import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { Editor } from './components/Editor';
import {
  DEFAULT_FOLDER_ID,
  extractTitleAndPreview,
  hashPassword,
  loadState,
  saveState,
} from './storage';
import type { AppState, Folder, Note, Selection } from './types';
import { filterNotes, noteToMarkdown, noteToPlainText } from './utils';
import { IconSidebar } from './icons';
import './App.css';

function selectionTitle(selection: Selection, folders: Folder[]): string {
  if (selection.kind === 'smart') {
    if (selection.id === 'all') return 'All iCloud';
    if (selection.id === 'trash') return 'Recently Deleted';
    if (selection.id === 'tags') return 'Tags';
    return 'Notes';
  }
  if (selection.kind === 'tag') return `#${selection.tag}`;
  return folders.find((f) => f.id === selection.id)?.name ?? 'Folder';
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadState().then(setState);
  }, []);

  useEffect(() => {
    if (!state) return;
    void saveState(state);
  }, [state]);

  useEffect(() => {
    function createNoteFromShortcut() {
      setState((s) => {
        if (!s) return s;
        if (s.selection.kind === 'smart' && s.selection.id === 'trash') return s;
        const folderId =
          s.selection.kind === 'folder' ? s.selection.id : DEFAULT_FOLDER_ID;
        const now = Date.now();
        const note: Note = {
          id: crypto.randomUUID(),
          folderId,
          title: 'New Note',
          content: '<div><br></div>',
          preview: '',
          tags: [],
          pinned: false,
          locked: false,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        return { ...s, notes: [note, ...s.notes], selectedNoteId: note.id };
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNoteFromShortcut();
      }
      if (meta && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>('.editor-search input')
          ?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    const unsubscribe = window.notesDesktop?.onMenuNewNote?.(
      createNoteFromShortcut,
    );

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      unsubscribe?.();
    };
  }, []);

  const visibleNotes = useMemo(
    () => (state ? filterNotes(state) : []),
    [state],
  );

  useEffect(() => {
    if (!state) return;
    if (
      state.selectedNoteId &&
      !visibleNotes.some((n) => n.id === state.selectedNoteId)
    ) {
      setState((s) =>
        s ? { ...s, selectedNoteId: visibleNotes[0]?.id ?? null } : s,
      );
    }
  }, [visibleNotes, state]);

  if (!state) {
    return <div className="boot">Loading…</div>;
  }

  const app = state;
  const selectedNote =
    visibleNotes.find((n) => n.id === app.selectedNoteId) ??
    app.notes.find((n) => n.id === app.selectedNoteId) ??
    null;
  const isTrash =
    app.selection.kind === 'smart' && app.selection.id === 'trash';
  const isElectron = Boolean(window.notesDesktop?.isElectron);

  function update(partial: Partial<AppState>) {
    setState((s) => (s ? { ...s, ...partial } : s));
  }

  function createNote() {
    setState((s) => {
      if (!s) return s;
      if (s.selection.kind === 'smart' && s.selection.id === 'trash') return s;
      const folderId =
        s.selection.kind === 'folder' ? s.selection.id : DEFAULT_FOLDER_ID;
      const now = Date.now();
      const note: Note = {
        id: crypto.randomUUID(),
        folderId,
        title: 'New Note',
        content: '<div><br></div>',
        preview: '',
        tags: [],
        pinned: false,
        locked: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      return { ...s, notes: [note, ...s.notes], selectedNoteId: note.id };
    });
  }

  function createFolder() {
    const name = window.prompt('Folder Name', 'New Folder');
    if (!name?.trim()) return;
    const folder: Folder = {
      id: crypto.randomUUID(),
      name: name.trim(),
      parentId: null,
      createdAt: Date.now(),
    };
    setState((s) =>
      s
        ? {
            ...s,
            folders: [...s.folders, folder],
            selection: { kind: 'folder', id: folder.id },
            selectedNoteId: null,
          }
        : s,
    );
  }

  function handleNoteChange(html: string) {
    if (!selectedNote || isTrash) return;
    const { title, preview, tags } = extractTitleAndPreview(html);
    setState((s) =>
      s
        ? {
            ...s,
            notes: s.notes.map((n) =>
              n.id === selectedNote.id
                ? {
                    ...n,
                    content: html,
                    title,
                    preview,
                    tags,
                    updatedAt: Date.now(),
                  }
                : n,
            ),
          }
        : s,
    );
  }

  function selectFolder(selection: Selection) {
    setState((s) => {
      if (!s) return s;
      const next = { ...s, selection };
      const notes = filterNotes(next);
      return { ...next, selectedNoteId: notes[0]?.id ?? null };
    });
  }

  async function ensurePassword(): Promise<string | null> {
    if (app.notePasswordHash) return app.notePasswordHash;
    const password = window.prompt(
      'Create a password to lock notes (store it safely — it cannot be recovered):',
    );
    if (!password?.trim()) return null;
    const hash = await hashPassword(password.trim());
    setState((s) => (s ? { ...s, notePasswordHash: hash } : s));
    return hash;
  }

  async function verifyPassword(): Promise<boolean> {
    const password = window.prompt('Enter password:');
    if (!password) return false;
    const hash = await hashPassword(password);
    if (!app.notePasswordHash || hash !== app.notePasswordHash) {
      window.alert('Incorrect password.');
      return false;
    }
    return true;
  }

  async function unlockNote() {
    if (!selectedNote) return;
    if (!(await verifyPassword())) return;
    setUnlockedIds((prev) => new Set(prev).add(selectedNote.id));
  }

  async function toggleLock() {
    if (!selectedNote) return;
    if (selectedNote.locked) {
      if (!(await verifyPassword())) return;
      setState((s) =>
        s
          ? {
              ...s,
              notes: s.notes.map((n) =>
                n.id === selectedNote.id ? { ...n, locked: false } : n,
              ),
            }
          : s,
      );
      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedNote.id);
        return next;
      });
      return;
    }
    const hash = await ensurePassword();
    if (!hash) return;
    setState((s) =>
      s
        ? {
            ...s,
            notes: s.notes.map((n) =>
              n.id === selectedNote.id ? { ...n, locked: true } : n,
            ),
          }
        : s,
    );
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(selectedNote.id);
      return next;
    });
  }

  async function exportNote(format: 'txt' | 'md' | 'html') {
    if (!selectedNote) return;
    const content =
      format === 'md'
        ? noteToMarkdown(selectedNote)
        : format === 'html'
          ? `<!doctype html><html><head><meta charset="utf-8"><title>${selectedNote.title}</title></head><body>${selectedNote.content}</body></html>`
          : noteToPlainText(selectedNote);
    const defaultPath = `${selectedNote.title || 'note'}.${format}`;

    if (window.notesDesktop?.isElectron) {
      await window.notesDesktop.exportFile({
        defaultPath,
        content,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });
      return;
    }

    const blob = new Blob([content], {
      type: format === 'html' ? 'text/html' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultPath;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function insertImage() {
    if (!selectedNote || isTrash) return;
    let dataUrl: string | null = null;
    let name = 'image';

    if (window.notesDesktop?.isElectron) {
      const picked = await window.notesDesktop.pickImage();
      if (!picked) return;
      dataUrl = picked.dataUrl;
      name = picked.name;
    } else {
      dataUrl = await new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    if (!dataUrl) return;
    const html = `${selectedNote.content}<div><img class="note-image" src="${dataUrl}" alt="${name}" /></div><div><br></div>`;
    handleNoteChange(html);
  }

  const activeNote =
    selectedNote &&
    (isTrash
      ? selectedNote.deletedAt !== null
      : selectedNote.deletedAt === null)
      ? selectedNote
      : (visibleNotes.find((n) => n.id === app.selectedNoteId) ?? null);

  return (
    <div className={`notes-app dark ${isElectron ? 'electron' : 'web'}`}>
      {!app.sidebarOpen && (
        <button
          type="button"
          className="show-sidebar-btn tool-btn"
          title="Show Sidebar"
          onClick={() => update({ sidebarOpen: true })}
        >
          <IconSidebar />
        </button>
      )}

      <div className="notes-body">
        {app.sidebarOpen && (
          <Sidebar
            folders={app.folders}
            notes={app.notes}
            selection={app.selection}
            onSelect={selectFolder}
            onNewFolder={createFolder}
            onToggleSidebar={() => update({ sidebarOpen: false })}
            onEmptyTrash={() => {
              if (!window.confirm('Permanently erase notes in Recently Deleted?'))
                return;
              setState((s) =>
                s
                  ? {
                      ...s,
                      notes: s.notes.filter((n) => n.deletedAt === null),
                      selectedNoteId: null,
                    }
                  : s,
              );
            }}
          />
        )}

        <NotesList
          title={selectionTitle(app.selection, app.folders)}
          notes={visibleNotes}
          folders={app.folders}
          selectedNoteId={app.selectedNoteId}
          sortBy={app.sortBy}
          viewMode={app.viewMode}
          onSelect={(id) => update({ selectedNoteId: id })}
          onSortChange={(sortBy) => update({ sortBy })}
          onViewModeChange={(viewMode) => update({ viewMode })}
          emptyLabel={isTrash ? 'No Deleted Notes' : 'No Notes'}
        />

        <Editor
          note={activeNote}
          folders={app.folders}
          isTrash={isTrash}
          unlocked={selectedNote ? unlockedIds.has(selectedNote.id) : false}
          search={app.search}
          onSearch={(search) => update({ search })}
          onNewNote={createNote}
          onUnlock={() => void unlockNote()}
          onChange={handleNoteChange}
          onTogglePin={() => {
            if (!selectedNote) return;
            setState((s) =>
              s
                ? {
                    ...s,
                    notes: s.notes.map((n) =>
                      n.id === selectedNote.id
                        ? { ...n, pinned: !n.pinned }
                        : n,
                    ),
                  }
                : s,
            );
          }}
          onToggleLock={() => void toggleLock()}
          onDelete={() => {
            if (!selectedNote) return;
            setState((s) =>
              s
                ? {
                    ...s,
                    notes: s.notes.map((n) =>
                      n.id === selectedNote.id
                        ? { ...n, deletedAt: Date.now(), pinned: false }
                        : n,
                    ),
                  }
                : s,
            );
          }}
          onRestore={() => {
            if (!selectedNote) return;
            setState((s) =>
              s
                ? {
                    ...s,
                    notes: s.notes.map((n) =>
                      n.id === selectedNote.id
                        ? { ...n, deletedAt: null }
                        : n,
                    ),
                  }
                : s,
            );
          }}
          onPermanentDelete={() => {
            if (!selectedNote) return;
            if (!window.confirm('Delete this note permanently?')) return;
            setState((s) =>
              s
                ? {
                    ...s,
                    notes: s.notes.filter((n) => n.id !== selectedNote.id),
                    selectedNoteId: null,
                  }
                : s,
            );
          }}
          onDuplicate={() => {
            if (!selectedNote) return;
            const now = Date.now();
            const copy: Note = {
              ...selectedNote,
              id: crypto.randomUUID(),
              title: `${selectedNote.title} copy`,
              pinned: false,
              locked: false,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            };
            setState((s) =>
              s
                ? {
                    ...s,
                    notes: [copy, ...s.notes],
                    selectedNoteId: copy.id,
                  }
                : s,
            );
          }}
          onMove={(folderId) => {
            if (!selectedNote) return;
            setState((s) =>
              s
                ? {
                    ...s,
                    notes: s.notes.map((n) =>
                      n.id === selectedNote.id
                        ? { ...n, folderId, updatedAt: Date.now() }
                        : n,
                    ),
                  }
                : s,
            );
          }}
          onExport={(format) => void exportNote(format)}
          onInsertImage={() => void insertImage()}
        />
      </div>
    </div>
  );
}
