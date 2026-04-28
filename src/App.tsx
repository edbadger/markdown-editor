import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorPane } from './components/EditorPane';
import { FolderPickerDialog } from './components/FolderPickerDialog';
import { CommandPalette } from './components/CommandPalette';
import { useFolderState } from './hooks/useFolderState';
import { useFileContent } from './hooks/useFileContent';
import { useAutoSave } from './hooks/useAutoSave';
import { useFileWatcher } from './hooks/useFileWatcher';
import { useTheme } from './hooks/useTheme';
import { api } from './lib/api';
import type { EditorMode } from './lib/types';

export default function App() {
  const {
    folder,
    loading: folderLoading,
    error: folderError,
    selectFolder,
    refresh,
    openFile,
    setOpenFile,
  } = useFolderState();
  const { theme, toggle: toggleTheme } = useTheme();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const v = localStorage.getItem('mdeditor.sidebarWidth');
      const n = v ? parseInt(v, 10) : 260;
      return Number.isFinite(n) && n > 0 ? n : 260;
    } catch {
      return 260;
    }
  });
  const [mode, setMode] = useState<EditorMode>('formatted');

  const handleSidebarResize = useCallback((w: number) => {
    setSidebarWidth(w);
    try {
      localStorage.setItem('mdeditor.sidebarWidth', String(w));
    } catch {
      // ignore
    }
  }, []);

  const file = useFileContent(openFile);

  // If the saved openFile no longer exists, drop it instead of showing an error.
  useEffect(() => {
    if (file.error && /ENOENT|not found|404/i.test(file.error)) {
      setOpenFile(null);
    }
  }, [file.error, setOpenFile]);
  const { saveState } = useAutoSave(
    openFile,
    file.content,
    file.baseline,
    (saved, mtime) => {
      file.setBaseline(saved);
      file.setKnownMtime(mtime);
    }
  );

  // Watch the active folder for external changes.
  useFileWatcher(!!folder, (event) => {
    if (event.type === 'add' || event.type === 'unlink' || event.type === 'addDir' || event.type === 'unlinkDir') {
      refresh();
    } else if (event.type === 'change') {
      // Skip reload if the file's mtime is the same as our last save/load —
      // it means this event is the echo of our own write.
      const isOwnSave =
        event.mtime !== undefined && event.mtime <= file.knownMtime;
      if (event.path === openFile && !file.dirty && !isOwnSave) {
        file.reload();
      }
      if (!isOwnSave) refresh();
    }
  });

  // Show folder picker on first run if no folder is set.
  useEffect(() => {
    if (!folderLoading && !folder) setPickerOpen(true);
  }, [folderLoading, folder]);

  const handleRename = useCallback(
    async (newPath: string) => {
      if (!openFile || newPath === openFile) return;
      try {
        await api.renameFile(openFile, newPath);
        setOpenFile(newPath);
        await refresh();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      }
    },
    [openFile, refresh, setOpenFile]
  );

  const handleNewFile = useCallback(async () => {
    const name = window.prompt('New file name (without extension):');
    if (!name) return;
    const safe = name.trim().replace(/[\\/]/g, '-');
    if (!safe) return;
    const relPath = safe.endsWith('.md') ? safe : `${safe}.md`;
    try {
      await api.createFile(relPath, `# ${stripExt(safe)}\n\n`);
      await refresh();
      setOpenFile(relPath);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  }, [refresh, setOpenFile]);

  return (
    <div className="flex h-full w-full">
      {folder && (
        <Sidebar
          folder={folder}
          activePath={openFile}
          onOpen={(p) => setOpenFile(p)}
          onChangeFolder={() => setPickerOpen(true)}
          onNewFile={handleNewFile}
          onCollapse={() => setSidebarCollapsed(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          collapsed={sidebarCollapsed}
          width={sidebarWidth}
          onResize={handleSidebarResize}
        />
      )}

      <main className="flex-1 overflow-hidden">
        <EditorPane
          filePath={openFile}
          content={file.content}
          onChange={file.setContent}
          mode={mode}
          onModeChange={setMode}
          saveState={saveState}
          error={file.error}
          sidebarCollapsed={sidebarCollapsed && !!folder}
          onShowSidebar={() => setSidebarCollapsed(false)}
          onRename={handleRename}
        />
      </main>

      <FolderPickerDialog
        open={pickerOpen}
        initialPath={folder?.root ?? ''}
        onPick={async (p) => {
          await selectFolder(p);
          setPickerOpen(false);
        }}
        onClose={folder ? () => setPickerOpen(false) : undefined}
        error={folderError}
      />

      {folder && (
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          nodes={folder.tree}
          onPick={(p) => setOpenFile(p)}
        />
      )}
    </div>
  );
}

function stripExt(name: string): string {
  return name.replace(/\.(md|markdown|mdx)$/i, '');
}
