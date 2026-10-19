type IconProps = {
  size?: number;
  className?: string;
  name: string;
};

/**
 * Bundle SF Symbol PNGs through Vite so Electron (file:// / asar) always
 * resolves them. Absolute `/sf/...` paths break in packaged apps.
 */
const sfModules = import.meta.glob('./assets/sf/*@2x.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const sfUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(sfModules)) {
  const file = path.split('/').pop() ?? '';
  const name = file.replace(/@2x\.png$/, '');
  sfUrls[name] = url;
}

function sfUrl(name: string): string {
  const url = sfUrls[name];
  if (!url) {
    console.warn(`[icons] missing SF asset: ${name}`);
    return '';
  }
  return url;
}

export function SFIcon({ name, size = 16, className }: IconProps) {
  const url = sfUrl(name);
  return (
    <span
      className={`sf-icon ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: url ? `url("${url}")` : undefined,
        maskImage: url ? `url("${url}")` : undefined,
      }}
      aria-hidden
    />
  );
}

export function IconFolder(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="folder-fill" size={p.size ?? 15} className={p.className} />;
}
export function IconFolderPlus(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="folder-badge-plus" size={p.size ?? 17} className={p.className} />;
}
export function IconNotes(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="note-text" size={p.size ?? 15} className={p.className} />;
}
export function IconQuickNote(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="quick-note" size={p.size ?? 15} className={p.className} />;
}
export function IconTrash(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="trash" size={p.size ?? 15} className={p.className} />;
}
export function IconSearch(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="search" size={p.size ?? 13} className={p.className} />;
}
export function IconCompose(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="square-and-pencil" size={p.size ?? 16} className={p.className} />;
}
export function IconSidebar(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="sidebar-left" size={p.size ?? 16} className={p.className} />;
}
export function IconChecklist(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="checklist" size={p.size ?? 16} className={p.className} />;
}
export function IconTable(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="tablecells" size={p.size ?? 16} className={p.className} />;
}
export function IconPaperclip(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="paperclip" size={p.size ?? 16} className={p.className} />;
}
export function IconMarkup(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="markup" size={p.size ?? 16} className={p.className} />;
}
export function IconAa(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="textformat" size={p.size ?? 15} className={p.className} />;
}
export function IconShare(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="share" size={p.size ?? 16} className={p.className} />;
}
export function IconEllipsis(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="ellipsis" size={p.size ?? 15} className={p.className} />;
}
export function IconEllipsisCircle(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="ellipsis-circle" size={p.size ?? 16} className={p.className} />;
}
export function IconLock(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="lock-fill" size={p.size ?? 12} className={p.className} />;
}
export function IconTag(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="tag-fill" size={p.size ?? 14} className={p.className} />;
}
export function IconPin(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="pin-fill" size={p.size ?? 11} className={p.className} />;
}
export function IconGallery(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="gallery" size={p.size ?? 14} className={p.className} />;
}
export function IconRows(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="rows" size={p.size ?? 14} className={p.className} />;
}
export function IconBold(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="bold" size={p.size ?? 14} className={p.className} />;
}
export function IconItalic(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="italic" size={p.size ?? 14} className={p.className} />;
}
export function IconUnderline(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="underline" size={p.size ?? 14} className={p.className} />;
}
export function IconListBulleted(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="list-bullet" size={p.size ?? 14} className={p.className} />;
}
export function IconListNumbered(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="list-number" size={p.size ?? 14} className={p.className} />;
}
export function IconLink(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="link" size={p.size ?? 14} className={p.className} />;
}
export function IconImage(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="photo" size={p.size ?? 15} className={p.className} />;
}
export function IconPlus(p: Omit<IconProps, 'name'>) {
  return <SFIcon name="plus" size={p.size ?? 14} className={p.className} />;
}
