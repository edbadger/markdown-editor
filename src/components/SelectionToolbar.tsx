import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Heading4,
  Check,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  bulletList: boolean;
  orderedList: boolean;
  heading: number | null;
  link: boolean;
  linkHref: string | null;
};

type Props = {
  position: { top: number; left: number };
  formats: ActiveFormats;
  onBold: () => void;
  onItalic: () => void;
  onBulletList: () => void;
  onOrderedList: () => void;
  onHeading: (level: 2 | 3 | 4) => void;
  onLink: (href: string | null) => void;
};

export function SelectionToolbar({
  position,
  formats,
  onBold,
  onItalic,
  onBulletList,
  onOrderedList,
  onHeading,
  onLink,
}: Props) {
  const [linkMode, setLinkMode] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Reset link mode when toolbar repositions to a different selection.
  useEffect(() => {
    setLinkMode(false);
  }, [position.top, position.left]);

  useEffect(() => {
    if (linkMode) {
      setLinkDraft(formats.linkHref ?? '');
      setTimeout(() => {
        linkInputRef.current?.focus();
        linkInputRef.current?.select();
      }, 0);
    }
  }, [linkMode, formats.linkHref]);

  const block = (handler: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    handler();
  };

  const handleLinkClick = () => {
    if (formats.link) {
      onLink(null);
    } else {
      setLinkMode(true);
    }
  };

  const applyLink = () => {
    const href = linkDraft.trim();
    if (!href) {
      setLinkMode(false);
      return;
    }
    const normalized = /^[a-z][a-z0-9+\-.]*:|^\//i.test(href)
      ? href
      : `https://${href}`;
    onLink(normalized);
    setLinkMode(false);
  };

  return (
    <div
      className="pointer-events-auto fixed z-40 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-full border border-black/10 bg-zinc-900/95 px-1 py-1 text-zinc-100 shadow-lg backdrop-blur transition-opacity dark:border-white/10 dark:bg-zinc-100 dark:text-zinc-900"
      style={{ top: position.top - 8, left: position.left }}
      role="toolbar"
      onMouseDown={(e) => e.preventDefault()}
    >
      {linkMode ? (
        <>
          <input
            ref={linkInputRef}
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setLinkMode(false);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Paste link"
            spellCheck={false}
            className="w-64 rounded-full bg-transparent px-3 py-1 text-sm text-zinc-100 placeholder:text-zinc-400 outline-none dark:text-zinc-900 dark:placeholder:text-zinc-500"
          />
          <ToolbarButton
            onMouseDown={block(applyLink)}
            title="Apply (Enter)"
          >
            <Check size={14} />
          </ToolbarButton>
          <ToolbarButton
            onMouseDown={block(() => setLinkMode(false))}
            title="Cancel (Esc)"
          >
            <X size={14} />
          </ToolbarButton>
        </>
      ) : (
        <>
          <ToolbarButton
            active={formats.heading === 2}
            onMouseDown={block(() => onHeading(2))}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={formats.heading === 3}
            onMouseDown={block(() => onHeading(3))}
            title="Heading 3"
          >
            <Heading3 size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={formats.heading === 4}
            onMouseDown={block(() => onHeading(4))}
            title="Heading 4"
          >
            <Heading4 size={15} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            active={formats.bold}
            onMouseDown={block(onBold)}
            title="Bold (Cmd+B)"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={formats.italic}
            onMouseDown={block(onItalic)}
            title="Italic (Cmd+I)"
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={formats.link}
            onMouseDown={block(handleLinkClick)}
            title={formats.link ? 'Remove link' : 'Add link'}
          >
            <LinkIcon size={13} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            active={formats.bulletList}
            onMouseDown={block(onBulletList)}
            title="Bullet list"
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={formats.orderedList}
            onMouseDown={block(onOrderedList)}
            title="Numbered list"
          >
            <ListOrdered size={15} />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onMouseDown,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      title={title}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
        active
          ? 'bg-white/15 text-white dark:bg-zinc-900/15 dark:text-zinc-900'
          : 'text-zinc-300 hover:bg-white/10 hover:text-white dark:text-zinc-600 dark:hover:bg-zinc-900/10 dark:hover:text-zinc-900'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <span className="mx-0.5 h-4 w-px bg-white/15 dark:bg-zinc-900/15" />
  );
}
