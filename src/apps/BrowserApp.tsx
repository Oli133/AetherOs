import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Bookmark, ExternalLink } from 'lucide-react';
import { sounds } from '../os/sound';

interface PresetPage {
  url: string;
  title: string;
  content: string;
}

const PRESET_PAGES: Record<string, PresetPage> = {
  'aether://docs': {
    url: 'aether://docs',
    title: 'AetherOS Documentation',
    content: `
      <div class="space-y-4">
        <h1 class="text-2xl font-bold text-sky-400">AetherOS Desktop Architecture Guide</h1>
        <p class="text-slate-300 leading-relaxed">
          AetherOS is engineered from the ground up for high-throughput, low-latency desktop computing. It achieves sub-16ms window manipulation through hardware-accelerated CSS compositing and zero-allocation process management.
        </p>
        <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <h2 class="text-lg font-semibold text-white">Core Pillars</h2>
          <ul class="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Lightweight Microkernel</strong>: Minimal footprint (&lt; 28 MB heap) with persistent in-browser VFS.</li>
            <li><strong>Cognition Kernel</strong>: Direct integration with Google Gemini with High Thinking mode for architectural inquiries.</li>
            <li><strong>Multi-Workspace Virtual Desktops</strong>: Fluid switching between workspaces via Alt+1, Alt+2, Alt+3.</li>
            <li><strong>POSIX Compatibility</strong>: Interactive shell with piping, file redirection, and scripting.</li>
          </ul>
        </div>
      </div>
    `,
  },
  'aether://news': {
    url: 'aether://news',
    title: 'Kernel Dispatch / Tech Digest',
    content: `
      <div class="space-y-4">
        <h1 class="text-2xl font-bold text-emerald-400">Systems Engineering Digest</h1>
        <div class="space-y-3">
          <article class="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <h3 class="text-base font-semibold text-slate-100">Zero-Copy Window Snapping in Modern Web Desktops</h3>
            <p class="text-xs text-slate-400 mt-1">Benchmarking GPU compositor frame drop rates during rapid multi-window resize events.</p>
          </article>
          <article class="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <h3 class="text-base font-semibold text-slate-100">The Power of Deep Thinking Models in Operating Systems</h3>
            <p class="text-xs text-slate-400 mt-1">How Gemini 3.8 and Gemini 4 enable proactive diagnosis of memory bottlenecks and file structure analysis.</p>
          </article>
        </div>
      </div>
    `,
  },
  'aether://mdn': {
    url: 'aether://mdn',
    title: 'Web APIs Quick Reference',
    content: `
      <div class="space-y-4">
        <h1 class="text-2xl font-bold text-purple-400">Web Standards & Hardware APIs</h1>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
            <div class="font-mono text-sky-400 font-semibold">Web Audio API</div>
            <p class="text-xs text-slate-400 mt-1">Low-latency audio synthesis directly from oscillator nodes without external audio assets.</p>
          </div>
          <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
            <div class="font-mono text-emerald-400 font-semibold">IndexedDB & VFS</div>
            <p class="text-xs text-slate-400 mt-1">High-performance persistent client-side storage for POSIX-compliant virtual file systems.</p>
          </div>
        </div>
      </div>
    `,
  },
};

export default function BrowserApp() {
  const [urlInput, setUrlInput] = useState<string>('aether://docs');
  const [currentUrl, setCurrentUrl] = useState<string>('aether://docs');
  const [history, setHistory] = useState<string[]>(['aether://docs']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const navigateTo = (url: string) => {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('aether://')) {
      if (clean.includes('.')) {
        clean = `https://${clean}`;
      } else {
        // Search query
        clean = `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
      }
    }
    setUrlInput(clean);
    setCurrentUrl(clean);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), clean]);
    setHistoryIndex((prev) => prev + 1);
    sounds.playClick();
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setCurrentUrl(history[nextIdx]);
      setUrlInput(history[nextIdx]);
      sounds.playClick();
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCurrentUrl(history[nextIdx]);
      setUrlInput(history[nextIdx]);
      sounds.playClick();
    }
  };

  const isInternal = currentUrl.startsWith('aether://');
  const internalData = PRESET_PAGES[currentUrl] || {
    url: currentUrl,
    title: 'Custom Page',
    content: `<div class="p-4 text-slate-300">Viewing <code>${currentUrl}</code></div>`,
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 text-xs font-sans select-text">
      {/* Navigation bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 select-none">
        <button
          onClick={handleBack}
          disabled={historyIndex <= 0}
          className="p-1 rounded text-slate-400 hover:text-white disabled:text-slate-600 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleForward}
          disabled={historyIndex >= history.length - 1}
          className="p-1 rounded text-slate-400 hover:text-white disabled:text-slate-600 transition-colors"
          title="Forward"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => navigateTo(currentUrl)}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Reload"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => navigateTo('aether://docs')}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Home"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        {/* Address input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(urlInput);
          }}
          className="flex-1 flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 focus-within:border-sky-500"
        >
          <Search className="w-3 h-3 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none font-mono"
            placeholder="Search the web or enter address (e.g. aether://docs)..."
          />
        </form>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/60 border-b border-slate-800 text-[11px] select-none">
        <Bookmark className="w-3 h-3 text-slate-500" />
        <button
          onClick={() => navigateTo('aether://docs')}
          className="text-slate-400 hover:text-sky-400 transition-colors px-1"
        >
          Aether Docs
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => navigateTo('aether://news')}
          className="text-slate-400 hover:text-emerald-400 transition-colors px-1"
        >
          Tech Digest
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => navigateTo('aether://mdn')}
          className="text-slate-400 hover:text-purple-400 transition-colors px-1"
        >
          Web APIs Reference
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
        {isInternal ? (
          <div
            className="max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: internalData.content }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <ExternalLink className="w-10 h-10 text-sky-400" />
            <div className="text-base font-semibold text-slate-200">External Web Request</div>
            <p className="text-xs text-slate-400 max-w-md">
              Due to browser sandbox iframe security, external URLs cannot be embedded directly. You can launch this link in a new window:
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium text-xs transition-colors"
            >
              Open {currentUrl} in New Tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
