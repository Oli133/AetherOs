import React, { useState } from 'react';
import { Cpu, Send, Sparkles, ChevronDown, ChevronRight, FileText, Download, RotateCcw, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { vfs } from '../os/filesystem';
import { sounds } from '../os/sound';

interface ReasoningMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thoughts?: string;
  model?: string;
  timestamp: number;
}

export default function CortexApp() {
  const { notify, refreshFs } = useSystem();
  const [messages, setMessages] = useState<ReasoningMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **AetherOS Cognition Kernel**.
I am configured with **Gemini High Thinking** mode to solve complex systems architecture, diagnose performance bottlenecks, draft shell automations, and analyze code.

How can I assist your desktop workflow today?`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [selectedContextFile, setSelectedContextFile] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available files in VFS for quick context injection
  const allFiles = vfs.getAllFiles().filter((f) => !f.isDirectory && (f.mimeType?.includes('text') || f.mimeType?.includes('javascript') || f.mimeType?.includes('markdown') || f.mimeType?.includes('python') || f.mimeType?.includes('sh')));

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
    sounds.playClick();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    sounds.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveToFile = (content: string, defaultName = 'kernel_analysis.md') => {
    const filename = prompt('Save to AetherOS filesystem as:', `/home/user/Documents/${defaultName}`);
    if (filename) {
      vfs.writeFile(filename, content);
      refreshFs();
      sounds.playSuccess();
      notify('File Saved', `Saved output to ${filename}`, 'success');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userPrompt = input.trim();
    setInput('');

    let contextData = '';
    if (selectedContextFile) {
      const fileContent = vfs.readFile(selectedContextFile);
      if (fileContent) {
        contextData = `[REFERENCED VFS FILE: ${selectedContextFile}]:\n${fileContent}`;
      }
    }

    const userMsg: ReasoningMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: selectedContextFile ? `[Context: ${selectedContextFile}]\n\n${userPrompt}` : userPrompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    sounds.playClick();

    try {
      const res = await fetch('/api/ai/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          context: contextData,
          mode: 'reason',
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg: ReasoningMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: data.output || 'Reasoning finished with no output.',
          thoughts: data.thoughts || undefined,
          model: data.model || 'gemini-3.8-flash (Thinking: HIGH)',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        // Auto-expand thoughts by default so user can inspect reasoning
        if (data.thoughts) {
          setExpandedThoughts((prev) => ({ ...prev, [assistantMsg.id]: true }));
        }
        sounds.playSuccess();
      } else {
        const errorMsg: ReasoningMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Cognition Fault**: ${data.error || data.output || 'Unable to execute thinking kernel.'}\n\nPlease verify that GEMINI_API_KEY is configured in your Secrets settings.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Network/Kernel Exception**: ${err?.message || 'Failed to reach backend API endpoint.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Analyze our microkernel performance bottlenecks and propose optimization',
    'Write a shell automation script to monitor high memory processes',
    'Explain how lightweight desktop window managers achieve sub-16ms latency',
    'Refactor prime_sieve.js for maximum SIMD / TypedArray throughput',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-text">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>High Thinking Kernel</span>
          </div>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">gemini-3.8-flash (ThinkingLevel.HIGH)</span>
        </div>

        <div className="flex items-center gap-3">
          {selectedContextFile && (
            <div className="flex items-center gap-1 text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              <FileText className="w-3 h-3 text-sky-400" />
              <span className="font-mono truncate max-w-[140px]">{selectedContextFile.split('/').pop()}</span>
              <button
                onClick={() => setSelectedContextFile('')}
                className="ml-1 text-slate-400 hover:text-rose-400"
                title="Remove file attachment"
              >
                ×
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setMessages([messages[0]]);
              sounds.playClick();
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-mono">
              <span>{msg.role === 'user' ? 'User' : 'Cognition Kernel'}</span>
              <span>·</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              {msg.model && (
                <>
                  <span>·</span>
                  <span className="text-sky-400">{msg.model}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 shadow-md'
              }`}
            >
              {/* Collapsible Thinking Process */}
              {msg.thoughts && (
                <div className="mb-3 rounded-lg border border-sky-800/60 bg-sky-950/40 overflow-hidden">
                  <button
                    onClick={() => toggleThought(msg.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-sky-300 hover:bg-sky-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      <span className="font-semibold">Reasoning Process ({msg.thoughts.split('\n').length} steps)</span>
                    </div>
                    {expandedThoughts[msg.id] ? (
                      <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </button>

                  {expandedThoughts[msg.id] && (
                    <div className="px-3.5 py-2.5 text-xs font-mono text-slate-300 bg-black/30 border-t border-sky-900/40 max-h-60 overflow-y-auto whitespace-pre-wrap leading-5">
                      {msg.thoughts}
                    </div>
                  )}
                </div>
              )}

              {/* Main content body */}
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>

              {/* Assistant Message Actions */}
              {msg.role === 'assistant' && msg.id !== 'welcome' && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => saveToFile(msg.content)}
                    className="flex items-center gap-1 hover:text-sky-300 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save to VFS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-mono">
              <Cpu className="w-3 h-3 text-sky-400 animate-spin" />
              <span>Cognition Kernel reasoning (ThinkingLevel.HIGH)...</span>
            </div>
            <div className="rounded-xl px-4 py-3 bg-slate-800/80 border border-slate-700 text-sm text-slate-300 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-mono text-xs">Analyzing deep multi-step constraints & system telemetry...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Queries (if few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-slate-800/60 bg-slate-950/40">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(prompt);
                sounds.playClick();
              }}
              className="text-xs text-slate-400 hover:text-sky-300 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950/90 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3 text-sky-400" />
            <span>Attach File:</span>
          </label>
          <select
            value={selectedContextFile}
            onChange={(e) => setSelectedContextFile(e.target.value)}
            className="text-xs bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="">None (General query)</option>
            {allFiles.map((f) => (
              <option key={f.path} value={f.path}>
                {f.path}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Cognition Kernel with High Thinking (e.g. system design, shell script, code optimization)..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Engage</span>
          </button>
        </div>
      </form>
    </div>
  );
}
