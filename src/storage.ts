import type { AppState, Folder, Note } from './types';

const STORAGE_KEY = 'clone-notes:v3';

export const ROOT_FOLDER_ID = 'folder-notes';
export const DEFAULT_FOLDER_ID = 'folder-notes';

function migrateNote(raw: Partial<Note> & { id: string }): Note {
  return {
    id: raw.id,
    folderId: raw.folderId ?? ROOT_FOLDER_ID,
    title: raw.title ?? 'Nova Nota',
    content: raw.content ?? '<div><br></div>',
    preview: raw.preview ?? '',
    tags: raw.tags ?? extractTags(raw.content ?? ''),
    pinned: raw.pinned ?? false,
    locked: raw.locked ?? false,
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
    deletedAt: raw.deletedAt ?? null,
  };
}

export function createDefaultState(): AppState {
  const now = Date.now();
  const trabalhoId = 'folder-trabalho';
  const rascunhosId = 'folder-rascunhos';
  const folders: Folder[] = [
    { id: ROOT_FOLDER_ID, name: 'Notes', parentId: null, createdAt: now },
    { id: rascunhosId, name: 'Rascunhos', parentId: null, createdAt: now },
    { id: trabalhoId, name: 'Trabalho', parentId: null, createdAt: now },
  ];

  const notes: Note[] = [
    {
      id: crypto.randomUUID(),
      folderId: ROOT_FOLDER_ID,
      title: 'New Note',
      content: '<div><br></div>',
      preview: '',
      tags: [],
      pinned: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: crypto.randomUUID(),
      folderId: trabalhoId,
      title: 'Welcome to Notes',
      content:
        '<div>Welcome to Notes</div><div><br></div><div>A refined clone of Apple Notes — folders, tags, tables, images, lock, and Electron.</div><div><br></div><div>• Create folders in the sidebar</div><div>• Format text, lists, and checklists</div><div>• Insert tables and photos</div><div>• Pin, lock, export, and move notes</div><div><br></div><div>#welcome #notes</div>',
      preview:
        'A refined clone of Apple Notes — folders, tags, tables, images, lock, and Electron.',
      tags: ['welcome', 'notes'],
      pinned: true,
      locked: false,
      createdAt: now - 86_400_000,
      updatedAt: now - 3_600_000,
      deletedAt: null,
    },
    {
      id: crypto.randomUUID(),
      folderId: rascunhosId,
      title: 'Ideas',
      content:
        '<div>Ideas</div><div><br></div><div>Jotting quick thoughts helps keep focus.</div><div><br></div><div>#idea</div>',
      preview: 'Jotting quick thoughts helps keep focus.',
      tags: ['idea'],
      pinned: false,
      locked: false,
      createdAt: now - 172_800_000,
      updatedAt: now - 86_400_000,
      deletedAt: null,
    },
  ];

  return {
    folders,
    notes,
    selection: { kind: 'smart', id: 'all' },
    selectedNoteId: notes[0]?.id ?? null,
    search: '',
    sidebarOpen: true,
    sortBy: 'updated',
    viewMode: 'list',
    notePasswordHash: null,
  };
}

function normalize(parsed: Partial<AppState>): AppState {
  const base = createDefaultState();
  return {
    ...base,
    ...parsed,
    folders: parsed.folders?.length ? parsed.folders : base.folders,
    notes: Array.isArray(parsed.notes)
      ? parsed.notes.map((n) => migrateNote(n))
      : base.notes,
    sortBy: parsed.sortBy ?? 'updated',
    viewMode: parsed.viewMode ?? 'list',
    notePasswordHash: parsed.notePasswordHash ?? null,
    sidebarOpen: parsed.sidebarOpen ?? true,
  };
}

export async function loadState(): Promise<AppState> {
  try {
    if (window.notesDesktop?.isElectron) {
      const raw = await window.notesDesktop.getStore();
      if (!raw) return createDefaultState();
      return normalize(JSON.parse(raw) as AppState);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return normalize(JSON.parse(raw) as AppState);
  } catch {
    return createDefaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  const payload = JSON.stringify({
    folders: state.folders,
    notes: state.notes,
    selection: state.selection,
    selectedNoteId: state.selectedNoteId,
    search: state.search,
    sidebarOpen: state.sidebarOpen,
    sortBy: state.sortBy,
    viewMode: state.viewMode,
    notePasswordHash: state.notePasswordHash,
  });

  if (window.notesDesktop?.isElectron) {
    await window.notesDesktop.setStore(payload);
    return;
  }
  localStorage.setItem(STORAGE_KEY, payload);
}

export function extractTags(html: string): string[] {
  const text = htmlToText(html);
  const matches = text.match(/#[\p{L}\p{N}_-]+/gu) ?? [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

export function extractTitleAndPreview(html: string): {
  title: string;
  preview: string;
  tags: string[];
} {
  const text = htmlToText(html);
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines[0]?.slice(0, 120) || 'Nova Nota';
  const preview = lines
    .slice(1)
    .filter((l) => !/^#[\p{L}\p{N}_-]+$/u.test(l))
    .join(' — ')
    .slice(0, 160);
  return { title, preview, tags: extractTags(html) };
}

function htmlToText(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ').trim();
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`notes-lock:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
