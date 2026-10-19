import type { AppState, Folder, Note, SortBy } from './types';
import { DEFAULT_FOLDER_ID } from './storage';

export function formatNoteDate(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (sameDay(d, yesterday)) return 'Yesterday';

  const weekAgo = new Date(now);
  weekAgo.setDate(today.getDate() - 6);
  if (d >= weekAgo) {
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  }

  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatEditorDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function filterNotes(state: AppState): Note[] {
  const q = state.search.trim().toLowerCase();
  let list = state.notes;

  if (state.selection.kind === 'smart' && state.selection.id === 'trash') {
    list = list.filter((n) => n.deletedAt !== null);
  } else {
    list = list.filter((n) => n.deletedAt === null);
    const sel = state.selection;
    if (sel.kind === 'smart' && sel.id === 'notes') {
      list = list.filter((n) => n.folderId === DEFAULT_FOLDER_ID);
    } else if (sel.kind === 'folder') {
      list = list.filter((n) => n.folderId === sel.id);
    } else if (sel.kind === 'tag') {
      list = list.filter((n) => n.tags.includes(sel.tag));
    } else if (sel.kind === 'smart' && sel.id === 'tags') {
      list = list.filter((n) => n.tags.length > 0);
    }
  }

  if (q) {
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.preview.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q.replace(/^#/, ''))),
    );
  }

  return sortNotes(list, state.sortBy);
}

export function sortNotes(notes: Note[], sortBy: SortBy): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'created') return b.createdAt - a.createdAt;
    return b.updatedAt - a.updatedAt;
  });
}

export type NoteGroup = { id: string; label: string; notes: Note[] };

export function groupNotes(notes: Note[], now = Date.now()): NoteGroup[] {
  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const today: Note[] = [];
  const previous7: Note[] = [];
  const earlier: Note[] = [];

  for (const note of unpinned) {
    const d = new Date(note.updatedAt);
    if (d >= startOfToday) today.push(note);
    else if (d >= weekAgo) previous7.push(note);
    else earlier.push(note);
  }

  const groups: NoteGroup[] = [];
  if (pinned.length) groups.push({ id: 'pinned', label: 'Pinned', notes: pinned });
  if (today.length) groups.push({ id: 'today', label: 'Today', notes: today });
  if (previous7.length)
    groups.push({ id: 'week', label: 'Previous 7 Days', notes: previous7 });
  if (earlier.length)
    groups.push({ id: 'earlier', label: 'Earlier', notes: earlier });
  return groups;
}

export function collectTags(notes: Note[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const note of notes) {
    if (note.deletedAt) continue;
    for (const tag of note.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function folderName(
  folders: Folder[] | undefined,
  folderId: string,
): string {
  return folders?.find((f) => f.id === folderId)?.name ?? 'Notes';
}

export function noteToMarkdown(note: Note): string {
  const el = document.createElement('div');
  el.innerHTML = note.content;
  const text = (el.innerText || '').trim();
  const tags = note.tags.map((t) => `#${t}`).join(' ');
  return `# ${note.title}\n\n${text}\n\n${tags}`.trim() + '\n';
}

export function noteToPlainText(note: Note): string {
  const el = document.createElement('div');
  el.innerHTML = note.content;
  return (el.innerText || '').trim() + '\n';
}
