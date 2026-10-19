import type { Folder, Note, Selection } from '../types';
import { collectTags } from '../utils';
import {
  IconFolder,
  IconFolderPlus,
  IconNotes,
  IconQuickNote,
  IconSidebar,
  IconTag,
  IconTrash,
} from '../icons';

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onNewFolder: () => void;
  onToggleSidebar: () => void;
  onEmptyTrash: () => void;
}

function countActive(notes: Note[], folderId?: string) {
  return notes.filter(
    (n) =>
      n.deletedAt === null &&
      (folderId === undefined || n.folderId === folderId),
  ).length;
}

function countTrash(notes: Note[]) {
  return notes.filter((n) => n.deletedAt !== null).length;
}

export function Sidebar({
  folders,
  notes,
  selection,
  onSelect,
  onNewFolder,
  onToggleSidebar,
  onEmptyTrash,
}: SidebarProps) {
  const tags = collectTags(notes);
  const trashCount = countTrash(notes);
  const root = folders[0];
  const customFolders = folders.slice(1);

  const isSmart = (id: 'all' | 'notes' | 'trash' | 'tags') =>
    selection.kind === 'smart' && selection.id === id;
  const isFolder = (id: string) =>
    selection.kind === 'folder' && selection.id === id;
  const isTag = (tag: string) =>
    selection.kind === 'tag' && selection.tag === tag;

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-top-spacer" />
        <button
          type="button"
          className="tool-btn"
          title="New Folder"
          aria-label="New Folder"
          onClick={onNewFolder}
        >
          <IconFolderPlus />
        </button>
        <button
          type="button"
          className="tool-btn"
          title="Hide Sidebar"
          aria-label="Hide Sidebar"
          onClick={onToggleSidebar}
        >
          <IconSidebar />
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className="sidebar-item"
          onClick={() => onSelect({ kind: 'smart', id: 'notes' })}
        >
          <span className="sidebar-item-left">
            <IconQuickNote className="icon-accent" />
            <span>Quick Notes</span>
          </span>
        </button>

        <div className="sidebar-section">
          <div className="sidebar-section-label">iCloud</div>

          <button
            type="button"
            className={`sidebar-item ${isSmart('all') ? 'active' : ''}`}
            onClick={() => onSelect({ kind: 'smart', id: 'all' })}
          >
            <span className="sidebar-item-left">
              <IconFolder className="icon-accent" />
              <span>All iCloud</span>
            </span>
            <span className="sidebar-count">{countActive(notes)}</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${isSmart('notes') ? 'active' : ''}`}
            onClick={() => onSelect({ kind: 'smart', id: 'notes' })}
          >
            <span className="sidebar-item-left">
              <IconNotes className="icon-accent" />
              <span>Notes</span>
            </span>
            <span className="sidebar-count">
              {countActive(notes, root?.id)}
            </span>
          </button>

          {customFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={`sidebar-item ${isFolder(folder.id) ? 'active' : ''}`}
              onClick={() => onSelect({ kind: 'folder', id: folder.id })}
            >
              <span className="sidebar-item-left">
                <IconFolder className="icon-accent" />
                <span>{folder.name}</span>
              </span>
              <span className="sidebar-count">
                {countActive(notes, folder.id)}
              </span>
            </button>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Tags</div>
            {tags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                className={`sidebar-item ${isTag(tag) ? 'active' : ''}`}
                onClick={() => onSelect({ kind: 'tag', tag })}
              >
                <span className="sidebar-item-left">
                  <IconTag className="icon-muted" />
                  <span>#{tag}</span>
                </span>
                <span className="sidebar-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-section">
          <button
            type="button"
            className={`sidebar-item ${isSmart('trash') ? 'active' : ''}`}
            onClick={() => onSelect({ kind: 'smart', id: 'trash' })}
          >
            <span className="sidebar-item-left">
              <IconTrash className="icon-muted" />
              <span>Recently Deleted</span>
            </span>
            <span className="sidebar-count">{trashCount}</span>
          </button>
          {isSmart('trash') && trashCount > 0 && (
            <button
              type="button"
              className="empty-trash-btn"
              onClick={onEmptyTrash}
            >
              Empty
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}
