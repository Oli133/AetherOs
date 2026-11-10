import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Cpu, Calculator, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { APP_REGISTRY } from '../os/appRegistry';
import { vfs } from '../os/filesystem';
import { AppId } from '../os/types';
import { sounds } from '../os/sound';

export default function SpotlightModal() {
  const { isSpotlightOpen, setSpotlightOpen, openApp } = useSystem();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSpotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSpotlightOpen]);

  if (!isSpotlightOpen) return null;

  // Search over apps
  const matchedApps = Object.values(APP_REGISTRY).filter(
    (app) =>
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.description.toLowerCase().includes(query.toLowerCase())
  );

  // Search over VFS files
  const matchedFiles = query.trim() ? vfs.search(query).slice(0, 5) : [];

  // Quick math evaluation
  let mathResult: string | null = null;
  if (/^[\d\s+\-*/().^%]+$/.test(query.trim()) && query.trim().length >= 3) {
    try {
      const res = new Function(`return (${query.replace(/%/g, '/100')})`)();
      if (typeof res === 'number' && !isNaN(res)) {
        mathResult = `= ${res.toLocaleString()}`;
      }
    } catch {}
  }

  // Combined results list
  const results: Array<{
    id: string;
    type: 'app' | 'file' | 'math' | 'ai';
    title: string;
    subtitle: string;
    action: () => void;
  }> = [];

  if (mathResult) {
    results.push({
      id: 'math',
      type: 'math',
      title: mathResult,
      subtitle: `Calculation result for "${query}"`,
      action: () => {
        openApp('calculator');
        setSpotlightOpen(false);
      },
    });
  }

  if (query.trim()) {
    results.push({
      id: 'ai-prompt',
      type: 'ai',
      title: `Ask Cognition Kernel: "${query}"`,
      subtitle: 'Execute high-thinking reasoning with Gemini kernel',
      action: () => {
        openApp('cortex');
        setSpotlightOpen(false);
      },
    });
  }

  matchedApps.forEach((app) => {
    results.push({
      id: `app-${app.id}`,
      type: 'app',
      title: app.name,
      subtitle: app.description,
      action: () => {
        openApp(app.id as AppId);
        setSpotlightOpen(false);
      },
    });
  });

  matchedFiles.forEach((file) => {
    results.push({
      id: `file-${file.path}`,
      type: 'file',
      title: file.name,
      subtitle: file.path,
      action: () => {
        if (file.isDirectory) {
          openApp('files', { currentPath: file.path });
        } else {
          openApp('editor', { filePath: file.path });
        }
        setSpotlightOpen(false);
      },
    });
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSpotlightOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        sounds.playClick();
      }
    }
  };

  return (
    <div
      onClick={() => setSpotlightOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search applications, files, calculate, or ask AI..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No applications or files matching &quot;{query}&quot;
            </div>
          ) : (
            results.map((res, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={res.id}
                  onClick={() => {
                    res.action();
                    sounds.playClick();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {res.type === 'app' ? (
                        <ArrowRight className="w-4 h-4" />
                      ) : res.type === 'ai' ? (
                        <Cpu className="w-4 h-4 text-sky-300" />
                      ) : res.type === 'math' ? (
                        <Calculator className="w-4 h-4 text-amber-300" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {res.title}
                      </div>
                      <div
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-sky-100' : 'text-slate-400'
                        }`}
                      >
                        {res.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-4 h-4 text-sky-200 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>Navigate with ↑ and ↓</span>
          <span>Press ↵ to launch</span>
        </div>
      </div>
    </div>
  );
}
