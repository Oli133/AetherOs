import React, { useState, useEffect } from 'react';
import { Play, Save, Cpu, Plus, X, Terminal, Check, FolderOpen } from 'lucide-react';
import { vfs } from '../os/filesystem';
import { useSystem } from '../os/systemContext';
import { sounds } from '../os/sound';

interface TabItem {
  id: string;
  path: string;
  title: string;
  content: string;
  isDirty: boolean;
}

export default function EditorApp({ filePath }: { filePath?: string }) {
  const { notify, refreshFs, openApp } = useSystem();
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Initialize with passed filePath or default Welcome Readme
  useEffect(() => {
    const targetPath = filePath || '/home/user/Desktop/Welcome_to_AetherOS.md';
    const content = vfs.readFile(targetPath) || '# Untitled Document\n';
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      path: targetPath,
      title: targetPath.split('/').pop() || 'Untitled',
      content,
      isDirty: false,
    };
    setTabs([newTab]);
    setActiveTabId(newTab.id);
  }, [filePath]);

  const handleContentChange = (val: string) => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, content: val, isDirty: true } : t))
    );
  };

  const saveFile = () => {
    if (!activeTab) return;
    vfs.writeFile(activeTab.path, activeTab.content);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, isDirty: false } : t))
    );
    refreshFs();
    sounds.playSuccess();
    setStatusMessage('Saved to VFS');
    notify('File Saved', `Saved ${activeTab.title} successfully`, 'success');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const saveAs = () => {
    if (!activeTab) return;
    const newPath = prompt('Save file as (full VFS path):', activeTab.path);
    if (!newPath) return;
    vfs.writeFile(newPath, activeTab.content);
    const title = newPath.split('/').pop() || 'Untitled';
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, path: newPath, title, isDirty: false } : t))
    );
    refreshFs();
    sounds.playSuccess();
    notify('File Saved', `Saved as ${newPath}`, 'success');
  };

  const openNewFile = () => {
    const newPath = `/home/user/Documents/snippet_${Date.now().toString().slice(-4)}.js`;
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      path: newPath,
      title: newPath.split('/').pop() || 'snippet.js',
      content: `// AetherOS JavaScript execution test\nconsole.log("Kernel execution started");\n\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log("Sum result:", sum);\n`,
      isDirty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    sounds.playClick();
  };

  const openExistingFile = () => {
    const path = prompt('Enter VFS path to open:', '/home/user/Projects/prime_sieve.js');
    if (!path) return;
    const content = vfs.readFile(path);
    if (content === null) {
      notify('File Not Found', `Cannot locate ${path}`, 'warn');
      return;
    }
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      path,
      title: path.split('/').pop() || 'file',
      content,
      isDirty: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    sounds.playClick();
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      if (remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      } else {
        openNewFile();
      }
    }
  };

  const runCode = () => {
    if (!activeTab) return;
    setIsConsoleOpen(true);
    setConsoleOutput([`[Executing ${activeTab.title}...]`]);
    sounds.playClick();

    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        warn: (...args: any[]) => logs.push(`[WARN] ${args.join(' ')}`),
        error: (...args: any[]) => logs.push(`[ERROR] ${args.join(' ')}`),
      };

      const start = performance.now();
      const runner = new Function('console', activeTab.content);
      runner(customConsole);
      const timeMs = (performance.now() - start).toFixed(2);

      setConsoleOutput((prev) => [
        ...prev,
        ...logs,
        `[Finished in ${timeMs}ms with exit code 0]`,
      ]);
      sounds.playSuccess();
    } catch (err: any) {
      setConsoleOutput((prev) => [...prev, `[Runtime Error]: ${err.message}`]);
    }
  };

  const askAiReview = () => {
    if (!activeTab) return;
    openApp('cortex');
    sounds.playClick();
  };

  const lineCount = activeTab ? activeTab.content.split('\n').length : 1;
  const wordCount = activeTab ? activeTab.content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 text-xs font-sans select-text">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[65%]">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  sounds.playClick();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x cursor-pointer text-xs transition-colors shrink-0 ${
                  isActive
                    ? 'bg-slate-950 text-sky-400 border-slate-700 font-medium'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="truncate max-w-[120px]">{tab.title}</span>
                {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="text-slate-400 hover:text-rose-400 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          <button
            onClick={openNewFile}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openExistingFile}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
            title="Open file from VFS"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          <button
            onClick={saveFile}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={runCode}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
            title="Run Code Snippet"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>

          <button
            onClick={askAiReview}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors"
            title="Consult Cognition Kernel"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Review</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 bg-slate-950 text-slate-600 font-mono text-[11px] text-right pr-2 pt-3 select-none leading-5 shrink-0 border-r border-slate-900">
          {Array.from({ length: Math.max(lineCount, 25) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <textarea
            value={activeTab?.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveFile();
              }
            }}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950 text-slate-100 font-mono text-[12px] p-3 focus:outline-none resize-none leading-5 caret-sky-400"
            placeholder="Write code or documents..."
          />

          {/* Integrated Console Tray */}
          {isConsoleOpen && (
            <div className="h-40 bg-black/90 border-t border-slate-800 flex flex-col">
              <div className="flex items-center justify-between px-3 py-1 bg-slate-900/80 text-[11px] font-mono text-slate-400 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span>Execution Output</span>
                </div>
                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-slate-300 space-y-0.5">
                {consoleOutput.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>{activeTab?.path}</span>
          {statusMessage && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" />
              <span>{statusMessage}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 tabular-nums">
          <span>{lineCount} lines</span>
          <span>{wordCount} words</span>
          <span>UTF-8</span>
          <span>JavaScript / Markdown</span>
        </div>
      </div>
    </div>
  );
}
