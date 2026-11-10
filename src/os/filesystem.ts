import { FileItem } from './types';

const STORAGE_KEY = 'aether_os_vfs_v1';

const INITIAL_FILES: FileItem[] = [
  // Root & system directories
  { id: 'dir-root', name: '', path: '/', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-bin', name: 'bin', path: '/bin', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-etc', name: 'etc', path: '/etc', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-var', name: 'var', path: '/var', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-log', name: 'log', path: '/var/log', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-home', name: 'home', path: '/home', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-user', name: 'user', path: '/home/user', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-desktop', name: 'Desktop', path: '/home/user/Desktop', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-documents', name: 'Documents', path: '/home/user/Documents', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-downloads', name: 'Downloads', path: '/home/user/Downloads', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-pictures', name: 'Pictures', path: '/home/user/Pictures', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },
  { id: 'dir-projects', name: 'Projects', path: '/home/user/Projects', isDirectory: true, sizeBytes: 0, updatedAt: Date.now() },

  // System configuration files
  {
    id: 'file-os-release',
    name: 'os-release',
    path: '/etc/os-release',
    isDirectory: false,
    content: `NAME="AetherOS Desktop"
VERSION="4.2 LTS (Argon Release)"
ID=aetheros
PRETTY_NAME="AetherOS 4.2 LTS (x86_64 High-Throughput)"
KERNEL="Aether-Microkernel v6.12-rt-lowlatency"
ARCH="x86_64"
COGNITION_SUBSYSTEM="Gemini Thinking Kernel active"
`,
    sizeBytes: 242,
    updatedAt: Date.now(),
    mimeType: 'text/plain',
  },
  {
    id: 'file-hosts',
    name: 'hosts',
    path: '/etc/hosts',
    isDirectory: false,
    content: `127.0.0.1 localhost\n127.0.1.1 aether-workstation\n::1 ip6-localhost ip6-loopback\n`,
    sizeBytes: 74,
    updatedAt: Date.now(),
    mimeType: 'text/plain',
  },
  {
    id: 'file-kernel-log',
    name: 'kernel.log',
    path: '/var/log/kernel.log',
    isDirectory: false,
    content: `[0.000000] Initializing AetherOS Microkernel v6.12-rt...
[0.001420] Memory Manager: Zero-allocation virtual page tables mapped.
[0.003180] CPU: Real-time scheduler online with low-latency ticks.
[0.005110] VFS: In-memory POSIX filesystem initialized.
[0.008440] GPU/Window Manager: Hardware acceleration enabled.
[0.012050] Cognition Kernel: Gemini High-Thinking daemon ready.
[0.015200] System ready. Welcome to AetherOS.
`,
    sizeBytes: 395,
    updatedAt: Date.now(),
    mimeType: 'text/plain',
  },

  // Desktop files
  {
    id: 'file-desktop-readme',
    name: 'Welcome_to_AetherOS.md',
    path: '/home/user/Desktop/Welcome_to_AetherOS.md',
    isDirectory: false,
    content: `# Welcome to AetherOS Desktop

AetherOS is an ultra-lightweight, high-performance operating system designed for modern desktop computers.

## Highlights
- **Sub-10ms Window Manager**: Zero-latency drag, snap, minimize, and multi-workspace tiling.
- **Deep Cognition Kernel**: Embedded AI assistant powered by Gemini with High Thinking mode to tackle complex architecture, debugging, and systems engineering queries.
- **POSIX-Compliant Terminal**: Real virtual file manipulation, process inspection, pipeline support, and shell scripting.
- **Robust Built-In App Suite**:
  - File Explorer with real host import/export
  - Forge Code Editor with in-browser execution
  - Live Task Monitor with process termination & CPU graphs
  - Horizon Web Browser
  - Scientific Calculator & System Benchmark
- **Full Privacy & Resilience**: In-memory virtual filesystem with persistent browser backup.

Press **Cmd+Space** (or **Ctrl+Space**) anytime to invoke Spotlight Search.
`,
    sizeBytes: 885,
    updatedAt: Date.now(),
    mimeType: 'text/markdown',
  },
  {
    id: 'file-desktop-bench',
    name: 'run_benchmark.sh',
    path: '/home/user/Desktop/run_benchmark.sh',
    isDirectory: false,
    content: `#!/bin/sh
# AetherOS System Performance Evaluation Script
echo "Executing AetherOS Stress Benchmark..."
benchmark --cycles 50000
echo "Performance evaluation completed successfully."
`,
    sizeBytes: 185,
    updatedAt: Date.now(),
    mimeType: 'application/x-sh',
  },

  // Documents
  {
    id: 'file-doc-specs',
    name: 'System_Architecture_Specs.txt',
    path: '/home/user/Documents/System_Architecture_Specs.txt',
    isDirectory: false,
    content: `AETHEROS WORKSTATION SPECIFICATIONS
----------------------------------------
Kernel Type: Asynchronous Event-Driven Microkernel
Memory Footprint: < 28 MB Base Shell
Execution Target: Desktop High-Density Displays (1440p / 4K)
Graphics Pipeline: CSS Compositor 60 FPS hardware accelerated
File System: Hierarchical Virtual Block Store (POSIX conformant)
Security Model: Sandboxed process execution contexts
AI Integration: Server-proxied Gemini High-Thinking Engine
`,
    sizeBytes: 420,
    updatedAt: Date.now(),
    mimeType: 'text/plain',
  },
  {
    id: 'file-doc-notes',
    name: 'Engineering_Roadmap.md',
    path: '/home/user/Documents/Engineering_Roadmap.md',
    isDirectory: false,
    content: `# Engineering Roadmap

1. [x] Zero-latency window manager with edge snapping.
2. [x] High-thinking Gemini kernel reasoning integration.
3. [x] Multi-workspace support (Desktops 1, 2, 3).
4. [x] Virtual shell with piping, grep, tree, and process tools.
5. [x] Host file import / export bridge.
6. [ ] WebAssembly kernel runtime bridge.
`,
    sizeBytes: 310,
    updatedAt: Date.now(),
    mimeType: 'text/markdown',
  },

  // Projects
  {
    id: 'file-proj-algo',
    name: 'prime_sieve.js',
    path: '/home/user/Projects/prime_sieve.js',
    isDirectory: false,
    content: `// Fast Sieve of Eratosthenes benchmark
function countPrimes(max) {
  const isPrime = new Uint8Array(max + 1);
  isPrime.fill(1);
  isPrime[0] = 0;
  isPrime[1] = 0;
  const sqrt = Math.sqrt(max);
  for (let i = 2; i <= sqrt; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= max; j += i) {
        isPrime[j] = 0;
      }
    }
  }
  let count = 0;
  for (let i = 2; i <= max; i++) {
    if (isPrime[i]) count++;
  }
  return count;
}

const t0 = performance.now();
const total = countPrimes(1000000);
const dt = (performance.now() - t0).toFixed(2);
console.log(\`Found \${total} primes up to 1,000,000 in \${dt}ms\`);
`,
    sizeBytes: 605,
    updatedAt: Date.now(),
    mimeType: 'application/javascript',
  },
  {
    id: 'file-proj-python',
    name: 'matrix_multiply.py',
    path: '/home/user/Projects/matrix_multiply.py',
    isDirectory: false,
    content: `import time

def multiply_matrices(n):
    # Simulated N x N Matrix multiplication benchmark
    a = [[1.0 for _ in range(n)] for _ in range(n)]
    b = [[2.0 for _ in range(n)] for _ in range(n)]
    c = [[0.0 for _ in range(n)] for _ in range(n)]
    for i in range(n):
        for j in range(n):
            c[i][j] = sum(a[i][k] * b[k][j] for k in range(n))
    return c

print("AetherOS Matrix Optimization Suite ready.")
`,
    sizeBytes: 425,
    updatedAt: Date.now(),
    mimeType: 'text/x-python',
  },
];

export class VirtualFileSystem {
  private files: Map<string, FileItem> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: FileItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((f) => this.files.set(f.path, f));
          return;
        }
      }
    } catch (e) {
      console.warn('VFS storage load failed, using defaults', e);
    }

    // Default initialization
    INITIAL_FILES.forEach((f) => this.files.set(f.path, f));
    this.persist();
  }

  public persist() {
    try {
      const arr = Array.from(this.files.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('VFS storage persist failed', e);
    }
  }

  public resetToDefaults() {
    this.files.clear();
    INITIAL_FILES.forEach((f) => this.files.set(f.path, f));
    this.persist();
  }

  public normalizePath(path: string, currentDir: string = '/home/user'): string {
    let clean = path.trim();
    if (!clean.startsWith('/')) {
      clean = currentDir === '/' ? `/${clean}` : `${currentDir}/${clean}`;
    }

    const segments = clean.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        resolved.pop();
      } else {
        resolved.push(seg);
      }
    }

    return '/' + resolved.join('/');
  }

  public get(path: string): FileItem | undefined {
    return this.files.get(path);
  }

  public exists(path: string): boolean {
    return this.files.has(path);
  }

  public list(dirPath: string): FileItem[] {
    const norm = dirPath === '/' ? '/' : dirPath.replace(/\/$/, '');
    const results: FileItem[] = [];

    for (const [p, item] of this.files.entries()) {
      if (p === norm) continue;
      const parent = this.getParentPath(p);
      if (parent === norm) {
        results.push(item);
      }
    }

    return results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  public getParentPath(path: string): string {
    if (path === '/') return '/';
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === 0) return '/';
    return path.substring(0, lastSlash);
  }

  public getBasename(path: string): string {
    if (path === '/') return '/';
    return path.split('/').filter(Boolean).pop() || '';
  }

  public writeFile(path: string, content: string): FileItem {
    const norm = this.normalizePath(path);
    const parentPath = this.getParentPath(norm);

    if (parentPath !== '/' && !this.files.has(parentPath)) {
      this.mkdir(parentPath, true);
    }

    const name = this.getBasename(norm);
    const existing = this.files.get(norm);

    const item: FileItem = {
      id: existing ? existing.id : `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      path: norm,
      isDirectory: false,
      content,
      sizeBytes: new Blob([content]).size,
      updatedAt: Date.now(),
      mimeType: this.guessMimeType(name),
    };

    this.files.set(norm, item);
    this.persist();
    return item;
  }

  public readFile(path: string): string | null {
    const norm = this.normalizePath(path);
    const item = this.files.get(norm);
    if (!item || item.isDirectory) return null;
    return item.content ?? '';
  }

  public mkdir(path: string, recursive: boolean = false): boolean {
    const norm = this.normalizePath(path);
    if (this.files.has(norm)) return false;

    const parent = this.getParentPath(norm);
    if (parent !== '/' && !this.files.has(parent)) {
      if (recursive) {
        this.mkdir(parent, true);
      } else {
        return false;
      }
    }

    const name = this.getBasename(norm);
    const dir: FileItem = {
      id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      path: norm,
      isDirectory: true,
      sizeBytes: 0,
      updatedAt: Date.now(),
    };

    this.files.set(norm, dir);
    this.persist();
    return true;
  }

  public delete(path: string): boolean {
    const norm = this.normalizePath(path);
    if (norm === '/' || norm === '/home' || norm === '/home/user') return false; // Prevent root destruction

    const item = this.files.get(norm);
    if (!item) return false;

    if (item.isDirectory) {
      // Delete all children recursively
      const toDelete: string[] = [];
      for (const p of this.files.keys()) {
        if (p === norm || p.startsWith(`${norm}/`)) {
          toDelete.push(p);
        }
      }
      toDelete.forEach((p) => this.files.delete(p));
    } else {
      this.files.delete(norm);
    }

    this.persist();
    return true;
  }

  public search(query: string): FileItem[] {
    const q = query.toLowerCase();
    const results: FileItem[] = [];
    for (const item of this.files.values()) {
      if (item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)) {
        results.push(item);
      }
    }
    return results;
  }

  public getAllFiles(): FileItem[] {
    return Array.from(this.files.values());
  }

  public exportBackup(): string {
    return JSON.stringify(Array.from(this.files.values()), null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.files.clear();
        parsed.forEach((f) => this.files.set(f.path, f));
        this.persist();
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  }

  private guessMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return 'text/markdown';
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'application/javascript';
      case 'py':
        return 'text/x-python';
      case 'json':
        return 'application/json';
      case 'sh':
        return 'application/x-sh';
      case 'html':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'svg':
        return 'image/svg+xml';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      default:
        return 'text/plain';
    }
  }
}

export const vfs = new VirtualFileSystem();
