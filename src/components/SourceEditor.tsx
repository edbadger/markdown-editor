import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import {
  HighlightStyle,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const markdownHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.4em', fontWeight: '700' },
  { tag: t.heading2, fontSize: '1.25em', fontWeight: '700' },
  { tag: t.heading3, fontSize: '1.12em', fontWeight: '700' },
  { tag: t.heading, fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: 'var(--cm-accent, #2563EB)', textDecoration: 'underline' },
  { tag: t.url, color: 'var(--cm-accent, #2563EB)' },
  { tag: t.monospace, color: 'var(--cm-muted, #6B7280)' },
  { tag: t.meta, color: 'var(--cm-muted, #6B7280)' },
  { tag: t.contentSeparator, color: 'var(--cm-muted, #6B7280)' },
  { tag: t.quote, fontStyle: 'italic', color: 'var(--cm-muted, #6B7280)' },
]);

const baseTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'inherit',
    height: '100%',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--cm-muted, #6B7280)',
    opacity: '0.4',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    padding: '2rem 0',
  },
});

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function SourceEditor({ value, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;

    const themeCompartment = new Compartment();

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLine(),
        markdown({ codeLanguages: [] }),
        syntaxHighlighting(defaultHighlightStyle),
        syntaxHighlighting(markdownHighlight),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        themeCompartment.of(baseTheme),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (file switch, watcher reload).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="h-full w-full overflow-y-auto scrollbar-thin"
    />
  );
}
