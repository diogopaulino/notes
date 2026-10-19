import type { Folder, Note, SortBy, ViewMode } from '../types';
import { folderName, formatNoteDate, groupNotes } from '../utils';
import {
  IconEllipsisCircle,
  IconFolder,
  IconGallery,
  IconLock,
  IconPin,
  IconRows,
} from '../icons';

interface NotesListProps {
  title: string;
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  sortBy: SortBy;
  viewMode: ViewMode;
  onSelect: (id: string) => void;
  onSortChange: (sort: SortBy) => void;
  onViewModeChange: (mode: ViewMode) => void;
  emptyLabel?: string;
}

export function NotesList({
  title,
  notes,
  folders,
  selectedNoteId,
  sortBy,
  viewMode,
  onSelect,
  onSortChange,
  onViewModeChange,
  emptyLabel = 'No Notes',
}: NotesListProps) {
  const groups = groupNotes(notes);

  return (
    <section className="notes-list">
      <header className="notes-list-header">
        <div className="notes-list-heading">
          <h1>{title}</h1>
          <span className="notes-list-count">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>
        <div className="notes-list-actions">
          <div className="toolbar-menu">
            <button type="button" className="tool-btn circle" title="More">
              <IconEllipsisCircle />
            </button>
            <div className="toolbar-dropdown">
              <div className="dropdown-label">Sort By</div>
              <button
                type="button"
                className={sortBy === 'updated' ? 'checked' : ''}
                onClick={() => onSortChange('updated')}
              >
                Date Edited
              </button>
              <button
                type="button"
                className={sortBy === 'created' ? 'checked' : ''}
                onClick={() => onSortChange('created')}
              >
                Date Created
              </button>
              <button
                type="button"
                className={sortBy === 'title' ? 'checked' : ''}
                onClick={() => onSortChange('title')}
              >
                Title
              </button>
              <div className="dropdown-label">View</div>
              <button
                type="button"
                className={viewMode === 'list' ? 'checked' : ''}
                onClick={() => onViewModeChange('list')}
              >
                <IconRows size={13} /> List
              </button>
              <button
                type="button"
                className={viewMode === 'gallery' ? 'checked' : ''}
                onClick={() => onViewModeChange('gallery')}
              >
                <IconGallery size={13} /> Gallery
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`notes-list-scroll ${viewMode}`}>
        {notes.length === 0 && <div className="notes-empty">{emptyLabel}</div>}

        {viewMode === 'gallery' ? (
          <div className="gallery-grid">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={`gallery-card ${note.id === selectedNoteId ? 'selected' : ''}`}
                onClick={() => onSelect(note.id)}
              >
                <div className="gallery-card-title">
                  {note.pinned && <IconPin className="note-pin" />}
                  {note.locked && <IconLock className="note-lock" />}
                  {note.title || 'New Note'}
                </div>
                <div className="gallery-card-preview">
                  {note.locked
                    ? 'Locked'
                    : note.preview || 'No additional text'}
                </div>
                <div className="gallery-card-meta">
                  <IconFolder size={11} />
                  {folderName(folders, note.folderId)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="notes-group">
              <div className="notes-group-label">{group.label}</div>
              {group.notes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  folderLabel={folderName(folders, note.folderId)}
                  selected={note.id === selectedNoteId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function NoteRow({
  note,
  folderLabel,
  selected,
  onSelect,
}: {
  note: Note;
  folderLabel: string;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`note-row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(note.id)}
    >
      <div className="note-row-title">
        {note.pinned && <IconPin className="note-pin" />}
        {note.locked && <IconLock className="note-lock" />}
        {note.title || 'New Note'}
      </div>
      <div className="note-row-meta">
        <span className="note-row-date">{formatNoteDate(note.updatedAt)}</span>
        <span className="note-row-preview">
          {note.locked ? 'Locked' : note.preview || 'No additional text'}
        </span>
      </div>
      <div className="note-row-folder">
        <IconFolder size={11} className="note-folder-icon" />
        <span>{folderLabel}</span>
      </div>
    </button>
  );
}
