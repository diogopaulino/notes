export type FolderId = string;

export interface Folder {
  id: FolderId;
  name: string;
  parentId: FolderId | null;
  createdAt: number;
}

export interface Note {
  id: string;
  folderId: FolderId;
  title: string;
  content: string;
  preview: string;
  tags: string[];
  pinned: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export type Selection =
  | { kind: 'smart'; id: 'all' | 'notes' | 'trash' | 'tags' }
  | { kind: 'folder'; id: FolderId }
  | { kind: 'tag'; tag: string };

export type SortBy = 'updated' | 'created' | 'title';
export type ViewMode = 'list' | 'gallery';

export interface AppState {
  folders: Folder[];
  notes: Note[];
  selection: Selection;
  selectedNoteId: string | null;
  search: string;
  sidebarOpen: boolean;
  sortBy: SortBy;
  viewMode: ViewMode;
  notePasswordHash: string | null;
}

export interface NotesDesktopAPI {
  isElectron: true;
  getStore: () => Promise<string | null>;
  setStore: (json: string) => Promise<void>;
  exportFile: (payload: {
    defaultPath: string;
    content: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  pickImage: () => Promise<{ name: string; dataUrl: string } | null>;
  onMenuNewNote?: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    notesDesktop?: NotesDesktopAPI;
  }
}

export {};
