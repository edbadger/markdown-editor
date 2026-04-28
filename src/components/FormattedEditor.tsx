import { useEffect, useRef, useState } from 'react';
import {
  Editor,
  rootCtx,
  defaultValueCtx,
  editorViewCtx,
  parserCtx,
  commandsCtx,
} from '@milkdown/core';
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInHeadingCommand,
} from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { history } from '@milkdown/plugin-history';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Slice } from '@milkdown/prose/model';
import { TextSelection } from '@milkdown/prose/state';
import { setBlockType } from '@milkdown/prose/commands';
import type { EditorView } from '@milkdown/prose/view';
import { SelectionToolbar, type ActiveFormats } from './SelectionToolbar';

type Props = {
  value: string;
  onChange: (next: string) => void;
};

type ToolbarState = {
  position: { top: number; left: number };
  formats: ActiveFormats;
} | null;

function readActiveFormats(view: EditorView): ActiveFormats {
  const state = view?.state;
  if (!state) {
    return {
      bold: false,
      italic: false,
      bulletList: false,
      orderedList: false,
      heading: null,
      link: false,
      linkHref: null,
    };
  }
  const { schema, selection } = state;
  const { from, $from } = selection;
  const stored = state.storedMarks ?? selection.$from.marks();

  const isMark = (name: string) => {
    const mark = schema.marks[name];
    if (!mark) return false;
    if (selection.empty) return !!mark.isInSet(stored);
    return state.doc.rangeHasMark(from, selection.to, mark);
  };

  const blockNode = $from.node($from.depth);
  const heading =
    blockNode?.type.name === 'heading'
      ? (blockNode.attrs.level as number)
      : null;

  let bulletList = false;
  let orderedList = false;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'bullet_list') bulletList = true;
    if (node.type.name === 'ordered_list') orderedList = true;
  }

  const linkMark = schema.marks.link;
  let linkHref: string | null = null;
  if (linkMark) {
    const node = state.doc.nodeAt(from);
    const existing = node?.marks.find((m) => m.type === linkMark);
    if (existing) linkHref = (existing.attrs.href as string) ?? null;
  }

  return {
    bold: isMark('strong'),
    italic: isMark('emphasis'),
    bulletList,
    orderedList,
    heading,
    link: !!linkHref,
    linkHref,
  };
}

function computeToolbarPosition(view: EditorView):
  | { top: number; left: number }
  | null {
  const state = view?.state;
  if (!state) return null;
  const selection = state.selection;
  if (selection.empty || !(selection instanceof TextSelection)) return null;
  if (selection.from === selection.to) return null;
  try {
    const start = view.coordsAtPos(selection.from);
    const end = view.coordsAtPos(selection.to);
    const left = (Math.min(start.left, end.left) + Math.max(start.right, end.right)) / 2;
    const top = Math.min(start.top, end.top);
    return { left, top };
  } catch {
    return null;
  }
}

export function FormattedEditor({ value, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastValueRef = useRef(value);
  const internalUpdateRef = useRef(false);
  const [toolbar, setToolbar] = useState<ToolbarState>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, host);
        ctx.set(defaultValueCtx, value);
        ctx
          .get(listenerCtx)
          .markdownUpdated((_, markdown) => {
            if (internalUpdateRef.current) return;
            lastValueRef.current = markdown;
            onChangeRef.current(markdown);
          })
          .selectionUpdated((sCtx) => {
            if (!editorRef.current) return;
            try {
              const view = sCtx.get(editorViewCtx);
              if (!view?.state) return;
              const pos = computeToolbarPosition(view);
              if (!pos) {
                setToolbar(null);
                return;
              }
              setToolbar({ position: pos, formats: readActiveFormats(view) });
            } catch {
              // ignore — happens transiently during view dispatches
            }
          });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .create()
      .then((editor) => {
        if (cancelled) {
          editor.destroy();
          return;
        }
        editorRef.current = editor;
        lastValueRef.current = value;
      })
      .catch((err) => {
        console.error('Failed to create editor:', err);
      });

    const onScroll = () => setToolbar(null);
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener('scroll', onScroll);

    return () => {
      cancelled = true;
      scrollEl?.removeEventListener('scroll', onScroll);
      const editor = editorRef.current;
      editorRef.current = null;
      if (editor) editor.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes (file switch, watcher reload).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value === lastValueRef.current) return;

    internalUpdateRef.current = true;
    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parser = ctx.get(parserCtx);
        const doc = parser(value);
        if (!doc) return;
        const state = view.state;
        view.dispatch(
          state.tr.replace(
            0,
            state.doc.content.size,
            new Slice(doc.content, 0, 0)
          )
        );
      });
      lastValueRef.current = value;
    } catch (err) {
      console.error('Failed to sync editor content:', err);
    } finally {
      setTimeout(() => {
        internalUpdateRef.current = false;
      }, 0);
    }
  }, [value]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runCommand = (key: any, payload?: unknown) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.action((ctx) => {
      ctx.get(commandsCtx).call(key, payload);
      const view = ctx.get(editorViewCtx);
      const pos = computeToolbarPosition(view);
      if (!pos) {
        setToolbar(null);
      } else {
        setToolbar({ position: pos, formats: readActiveFormats(view) });
      }
    });
  };

  const setToParagraph = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const para = view.state.schema.nodes.paragraph;
      if (!para) return;
      setBlockType(para)(view.state, view.dispatch);
      const pos = computeToolbarPosition(view);
      if (!pos) {
        setToolbar(null);
      } else {
        setToolbar({ position: pos, formats: readActiveFormats(view) });
      }
    });
  };

  const handleHeading = (level: 2 | 3 | 4) => {
    if (toolbar?.formats.heading === level) {
      setToParagraph();
    } else {
      runCommand(wrapInHeadingCommand.key, level);
    }
  };

  const handleLink = (href: string | null) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const linkMark = state.schema.marks.link;
      if (!linkMark) return;
      const { from, to, empty } = state.selection;
      if (empty) return;
      const tr = state.tr;
      tr.removeMark(from, to, linkMark);
      if (href) {
        tr.addMark(from, to, linkMark.create({ href }));
      }
      view.dispatch(tr);
      const pos = computeToolbarPosition(view);
      if (!pos) {
        setToolbar(null);
      } else {
        setToolbar({ position: pos, formats: readActiveFormats(view) });
      }
    });
  };

  return (
    <div ref={scrollRef} className="relative h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-[720px] px-8 py-8">
        <div ref={hostRef} className="milkdown" />
      </div>
      {toolbar && (
        <SelectionToolbar
          position={toolbar.position}
          formats={toolbar.formats}
          onBold={() => runCommand(toggleStrongCommand.key)}
          onItalic={() => runCommand(toggleEmphasisCommand.key)}
          onBulletList={() => runCommand(wrapInBulletListCommand.key)}
          onOrderedList={() => runCommand(wrapInOrderedListCommand.key)}
          onHeading={handleHeading}
          onLink={handleLink}
        />
      )}
    </div>
  );
}
