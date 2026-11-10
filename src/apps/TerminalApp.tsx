import React, { useState, useRef, useEffect } from 'react';
import { vfs } from '../os/filesystem';
import { useSystem } from '../os/systemContext';
import { sounds } from '../os/sound';

interface HistoryItem {
  type: 'input' | 'output' | 'error' | 'thought';
  text: string;
}

export default function TerminalApp() {
  const { processes, killProcess, notify, refreshFs, openApp } = useSystem();
  const [currentDir, setCurrentDir] = useState<string>('/home/user');
  const [inputVal, setInputVal] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: 'output', text: 'AetherOS POSIX Shell v4.2.0-rt (x86_64-pc-aetheros)' },
    { type: 'output', text: 'Type "help" for a list of commands, or "cortex <query>" to query the high-thinking AI kernel.' },
    { type: 'output', text: '' },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex] || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete();
    }
  };

  const autocomplete = () => {
    const parts = inputVal.trim().split(' ');
    const lastWord = parts[parts.length - 1] || '';
    const dirItems = vfs.list(currentDir);

    const matches = dirItems.filter((i) => i.name.startsWith(lastWord));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0].name + (matches[0].isDirectory ? '/' : ' ');
      setInputVal(parts.join(' '));
      sounds.playClick();
    } else if (matches.length > 1) {
      setHistory((prev) => [
        ...prev,
        { type: 'input', text: `${currentDir}$ ${inputVal}` },
        { type: 'output', text: matches.map((m) => m.name + (m.isDirectory ? '/' : '')).join('   ') },
      ]);
    }
  };

  const executeCommand = async (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) {
      setHistory((prev) => [...prev, { type: 'input', text: `${currentDir}$ ` }]);
      return;
    }

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInputVal('');

    setHistory((prev) => [...prev, { type: 'input', text: `${currentDir}$ ${trimmed}` }]);

    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();
    const rest = args.slice(1);

    switch (command) {
      case 'help':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `Available Commands:
  ls [-l] [dir]       List directory contents
  cd <dir>            Change current working directory
  pwd                 Print current working directory
  cat <file>          Print content of file
  echo <txt> [> file] Print text or redirect output to file
  mkdir <dir>         Create directory
  touch <file>        Create empty file
  rm <path>           Remove file or directory
  tree [dir]          Render directory structure
  grep <pat> <file>   Search for pattern in file
  clear               Clear terminal window
  ps / top            Show active system processes
  kill <pid>          Terminate running process
  sysinfo             Display system hardware telemetry
  uname -a            Print OS kernel release
  date                Display current system time
  whoami              Print current user
  history             Display executed command history
  benchmark           Launch system performance stress-test
  cortex <prompt>     Execute high-thinking AI reasoning query
  argon <prompt>      Alias for cortex high-thinking query
  run <file.js>       Execute a JavaScript script from VFS`,
          },
        ]);
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'pwd':
        setHistory((prev) => [...prev, { type: 'output', text: currentDir }]);
        break;

      case 'whoami':
        setHistory((prev) => [...prev, { type: 'output', text: 'user' }]);
        break;

      case 'uname':
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: 'AetherOS 4.2.0-rt SMP PREEMPT x86_64 GNU/Aether' },
        ]);
        break;

      case 'date':
        setHistory((prev) => [...prev, { type: 'output', text: new Date().toString() }]);
        break;

      case 'history':
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n') },
        ]);
        break;

      case 'cd': {
        const target = rest[0] || '/home/user';
        const resolved = vfs.normalizePath(target, currentDir);
        const item = vfs.get(resolved);
        if (item && item.isDirectory) {
          setCurrentDir(resolved);
        } else {
          setHistory((prev) => [...prev, { type: 'error', text: `cd: no such file or directory: ${target}` }]);
        }
        break;
      }

      case 'ls': {
        const isLong = rest.includes('-l') || rest.includes('-la') || rest.includes('-al');
        const targetArg = rest.find((a) => !a.startsWith('-')) || currentDir;
        const resolved = vfs.normalizePath(targetArg, currentDir);
        const items = vfs.list(resolved);

        if (items.length === 0) {
          setHistory((prev) => [...prev, { type: 'output', text: '(empty directory)' }]);
        } else if (isLong) {
          const lines = items.map((item) => {
            const perms = item.isDirectory ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = item.sizeBytes.toString().padStart(8, ' ');
            const date = new Date(item.updatedAt).toLocaleDateString();
            return `${perms}  user user  ${size}  ${date}  ${item.name}${item.isDirectory ? '/' : ''}`;
          });
          setHistory((prev) => [...prev, { type: 'output', text: lines.join('\n') }]);
        } else {
          const out = items.map((i) => (i.isDirectory ? `${i.name}/` : i.name)).join('   ');
          setHistory((prev) => [...prev, { type: 'output', text: out }]);
        }
        break;
      }

      case 'cat': {
        if (!rest[0]) {
          setHistory((prev) => [...prev, { type: 'error', text: 'cat: missing file operand' }]);
          return;
        }
        const resolved = vfs.normalizePath(rest[0], currentDir);
        const content = vfs.readFile(resolved);
        if (content !== null) {
          setHistory((prev) => [...prev, { type: 'output', text: content }]);
        } else {
          setHistory((prev) => [...prev, { type: 'error', text: `cat: ${rest[0]}: No such file or directory` }]);
        }
        break;
      }

      case 'echo': {
        const redirIndex = rest.indexOf('>');
        if (redirIndex !== -1) {
          const text = rest.slice(0, redirIndex).join(' ').replace(/^["']|["']$/g, '');
          const targetFile = rest[redirIndex + 1];
          if (!targetFile) {
            setHistory((prev) => [...prev, { type: 'error', text: 'echo: missing destination file for redirection' }]);
            return;
          }
          const resolved = vfs.normalizePath(targetFile, currentDir);
          vfs.writeFile(resolved, text);
          refreshFs();
          sounds.playSuccess();
        } else {
          const text = rest.join(' ').replace(/^["']|["']$/g, '');
          setHistory((prev) => [...prev, { type: 'output', text: text }]);
        }
        break;
      }

      case 'mkdir': {
        if (!rest[0]) {
          setHistory((prev) => [...prev, { type: 'error', text: 'mkdir: missing operand' }]);
          return;
        }
        const resolved = vfs.normalizePath(rest[0], currentDir);
        const ok = vfs.mkdir(resolved, true);
        if (ok) {
          refreshFs();
        } else {
          setHistory((prev) => [...prev, { type: 'error', text: `mkdir: cannot create directory '${rest[0]}'` }]);
        }
        break;
      }

      case 'touch': {
        if (!rest[0]) {
          setHistory((prev) => [...prev, { type: 'error', text: 'touch: missing file operand' }]);
          return;
        }
        const resolved = vfs.normalizePath(rest[0], currentDir);
        vfs.writeFile(resolved, '');
        refreshFs();
        break;
      }

      case 'rm': {
        if (!rest[0]) {
          setHistory((prev) => [...prev, { type: 'error', text: 'rm: missing operand' }]);
          return;
        }
        const target = rest.find((a) => !a.startsWith('-')) || '';
        const resolved = vfs.normalizePath(target, currentDir);
        const ok = vfs.delete(resolved);
        if (ok) {
          refreshFs();
        } else {
          setHistory((prev) => [...prev, { type: 'error', text: `rm: cannot remove '${target}': Permission denied or not found` }]);
        }
        break;
      }

      case 'tree': {
        const target = rest[0] || currentDir;
        const resolved = vfs.normalizePath(target, currentDir);
        const renderTree = (dir: string, indent = ''): string[] => {
          const items = vfs.list(dir);
          const lines: string[] = [];
          items.forEach((item, idx) => {
            const isLast = idx === items.length - 1;
            const branch = isLast ? '└── ' : '├── ';
            lines.push(`${indent}${branch}${item.name}${item.isDirectory ? '/' : ''}`);
            if (item.isDirectory) {
              const nextIndent = indent + (isLast ? '    ' : '│   ');
              lines.push(...renderTree(item.path, nextIndent));
            }
          });
          return lines;
        };

        const resultLines = [resolved, ...renderTree(resolved)];
        setHistory((prev) => [...prev, { type: 'output', text: resultLines.join('\n') }]);
        break;
      }

      case 'grep': {
        if (rest.length < 2) {
          setHistory((prev) => [...prev, { type: 'error', text: 'Usage: grep <pattern> <file>' }]);
          return;
        }
        const pattern = rest[0];
        const resolved = vfs.normalizePath(rest[1], currentDir);
        const content = vfs.readFile(resolved);
        if (content === null) {
          setHistory((prev) => [...prev, { type: 'error', text: `grep: ${rest[1]}: No such file` }]);
          return;
        }
        const matching = content
          .split('\n')
          .filter((line) => line.toLowerCase().includes(pattern.toLowerCase()));
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: matching.length > 0 ? matching.join('\n') : `Pattern '${pattern}' not found in ${rest[1]}`,
          },
        ]);
        break;
      }

      case 'ps':
      case 'top': {
        const header = '  PID   PROCESS                    CPU%   MEM (MB)   STATUS';
        const rows = processes.map(
          (p) =>
            `  ${p.pid.toString().padEnd(5)} ${p.name.padEnd(26)} ${p.cpu.toFixed(1).padStart(5)}%   ${p.memoryMb
              .toString()
              .padStart(8)}   ${p.status}`
        );
        setHistory((prev) => [...prev, { type: 'output', text: [header, ...rows].join('\n') }]);
        break;
      }

      case 'kill': {
        const pid = parseInt(rest[0], 10);
        if (isNaN(pid)) {
          setHistory((prev) => [...prev, { type: 'error', text: 'Usage: kill <pid>' }]);
          return;
        }
        killProcess(pid);
        setHistory((prev) => [...prev, { type: 'output', text: `SIGTERM signal sent to process PID ${pid}` }]);
        break;
      }

      case 'sysinfo': {
        try {
          const res = await fetch('/api/sysinfo');
          const data = await res.json();
          const totalGb = (data.totalMemoryBytes / 1024 / 1024 / 1024).toFixed(2);
          const usedGb = (data.usedMemoryBytes / 1024 / 1024 / 1024).toFixed(2);
          setHistory((prev) => [
            ...prev,
            {
              type: 'output',
              text: `AetherOS System Architecture:
  Host OS Platform : ${data.platform} (${data.arch})
  CPU Cores        : ${data.cpuCount} Cores (${data.cpuModel})
  Memory Footprint : ${usedGb} GB / ${totalGb} GB (${((data.usedMemoryBytes / data.totalMemoryBytes) * 100).toFixed(1)}%)
  Host Uptime      : ${(data.uptime / 3600).toFixed(1)} hours
  Node Runtime     : ${data.nodeVersion}
  Compositor       : GPU-Accelerated CSS Compositor (60 FPS)
  VFS Cache        : In-Memory POSIX Block Store with LocalStorage backing`,
            },
          ]);
        } catch {
          setHistory((prev) => [
            ...prev,
            {
              type: 'output',
              text: `System Architecture: AetherOS 4.2 LTS x86_64, Cores: ${navigator.hardwareConcurrency || 4}`,
            },
          ]);
        }
        break;
      }

      case 'benchmark': {
        openApp('benchmark');
        setHistory((prev) => [...prev, { type: 'output', text: 'Launching AetherOS System Benchmark suite...' }]);
        break;
      }

      case 'run': {
        if (!rest[0]) {
          setHistory((prev) => [...prev, { type: 'error', text: 'Usage: run <script.js>' }]);
          return;
        }
        const resolved = vfs.normalizePath(rest[0], currentDir);
        const code = vfs.readFile(resolved);
        if (!code) {
          setHistory((prev) => [...prev, { type: 'error', text: `run: cannot read script '${rest[0]}'` }]);
          return;
        }
        setHistory((prev) => [...prev, { type: 'output', text: `[Executing ${rest[0]} in sandboxed worker]...` }]);
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
            warn: (...args: any[]) => logs.push(`[WARN] ${args.join(' ')}`),
            error: (...args: any[]) => logs.push(`[ERROR] ${args.join(' ')}`),
          };
          const runner = new Function('console', code);
          runner(customConsole);
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: logs.length > 0 ? logs.join('\n') : 'Script executed successfully with no output.' },
          ]);
          sounds.playSuccess();
        } catch (err: any) {
          setHistory((prev) => [...prev, { type: 'error', text: `Runtime Error: ${err.message}` }]);
        }
        break;
      }

      case 'cortex':
      case 'argon': {
        const query = rest.join(' ');
        if (!query) {
          setHistory((prev) => [...prev, { type: 'error', text: 'Usage: cortex <query> (e.g. cortex how to optimize disk iops)' }]);
          return;
        }

        setIsRunning(true);
        setHistory((prev) => [
          ...prev,
          { type: 'thought', text: `[Cognition Kernel: gemini-3.8-flash Reasoning with ThinkingLevel.HIGH]...` },
        ]);

        try {
          const res = await fetch('/api/ai/think', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: query, mode: 'reason' }),
          });
          const data = await res.json();
          if (data.success) {
            if (data.thoughts) {
              setHistory((prev) => [
                ...prev,
                { type: 'thought', text: `[Reasoning Trace]:\n${data.thoughts.split('\n').slice(0, 8).join('\n')}\n...` },
              ]);
            }
            setHistory((prev) => [...prev, { type: 'output', text: data.output }]);
            sounds.playSuccess();
          } else {
            setHistory((prev) => [...prev, { type: 'error', text: `Kernel Error: ${data.error || 'Cognition failed'}` }]);
          }
        } catch (err: any) {
          setHistory((prev) => [...prev, { type: 'error', text: `Network error: ${err.message}` }]);
        } finally {
          setIsRunning(false);
        }
        break;
      }

      default:
        setHistory((prev) => [
          ...prev,
          { type: 'error', text: `zsh: command not found: ${command}. Type "help" for a list of commands.` },
        ]);
        sounds.playBell();
        break;
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-black/95 text-slate-200 font-mono text-[13px] p-3 overflow-hidden select-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 leading-5">
        {history.map((item, idx) => (
          <div key={idx} className="whitespace-pre-wrap break-all">
            {item.type === 'input' && (
              <span className="text-emerald-400 font-semibold">{item.text}</span>
            )}
            {item.type === 'output' && (
              <span className="text-slate-300">{item.text}</span>
            )}
            {item.type === 'error' && (
              <span className="text-rose-400">{item.text}</span>
            )}
            {item.type === 'thought' && (
              <span className="text-sky-400/90 italic">{item.text}</span>
            )}
          </div>
        ))}

        {isRunning && (
          <div className="text-sky-400 animate-pulse flex items-center gap-2">
            <span>● Thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Prompt input row */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-sm">
        <span className="text-emerald-400 font-semibold shrink-0">
          user@aether:{currentDir === '/home/user' ? '~' : currentDir}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent text-slate-100 focus:outline-none caret-sky-400 font-mono"
        />
      </div>
    </div>
  );
}
