import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, HardDrive, Zap, Trash2, RefreshCw } from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { sounds } from '../os/sound';

export default function MonitorApp() {
  const { processes, killProcess, settings, setPowerProfile } = useSystem();
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'hardware'>('overview');
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(40).fill(12));
  const [memHistory, setMemHistory] = useState<number[]>(new Array(40).fill(28));
  const [hostSpecs, setHostSpecs] = useState<any>(null);

  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const memCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch real host info
  useEffect(() => {
    fetch('/api/sysinfo')
      .then((res) => res.json())
      .then((data) => setHostSpecs(data))
      .catch(() => {});
  }, []);

  // CPU and Memory live ticks
  useEffect(() => {
    const interval = setInterval(() => {
      // Dynamic calculation based on active processes and power profile
      const totalProcessCpu = processes.reduce((acc, p) => acc + p.cpu, 0);
      const baseJitter = (Math.random() - 0.5) * 4;
      const multiplier = settings.powerProfile === 'performance' ? 1.4 : settings.powerProfile === 'eco' ? 0.6 : 1.0;
      const currentCpu = Math.max(3, Math.min(99, (totalProcessCpu + 8 + baseJitter) * multiplier));

      const totalProcessMem = processes.reduce((acc, p) => acc + p.memoryMb, 0);
      const currentMem = Math.max(15, Math.min(85, (totalProcessMem / 350) * 100));

      setCpuHistory((prev) => [...prev.slice(1), currentCpu]);
      setMemHistory((prev) => [...prev.slice(1), currentMem]);
    }, 800);

    return () => clearInterval(interval);
  }, [processes, settings.powerProfile]);

  // Render canvas graph
  useEffect(() => {
    const drawGraph = (canvas: HTMLCanvasElement | null, data: number[], color: string) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Fill area under curve
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, color.replace('1)', '0.35)'));
      gradient.addColorStop(1, color.replace('1)', '0.02)'));

      ctx.beginPath();
      const step = w / (data.length - 1);
      data.forEach((val, i) => {
        const x = i * step;
        const y = h - (val / 100) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke line
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = i * step;
        const y = h - (val / 100) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawGraph(cpuCanvasRef.current, cpuHistory, 'rgba(56, 189, 248, 1)');
    drawGraph(memCanvasRef.current, memHistory, 'rgba(52, 211, 153, 1)');
  }, [cpuHistory, memHistory]);

  const latestCpu = cpuHistory[cpuHistory.length - 1]?.toFixed(1) || '0.0';
  const latestMem = memHistory[memHistory.length - 1]?.toFixed(1) || '0.0';

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 text-xs font-sans select-none">
      {/* Top Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('overview');
              sounds.playClick();
            }}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-sky-500/20 text-sky-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Performance Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('processes');
              sounds.playClick();
            }}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'processes'
                ? 'bg-sky-500/20 text-sky-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Process Controller ({processes.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('hardware');
              sounds.playClick();
            }}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'hardware'
                ? 'bg-sky-500/20 text-sky-400 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hardware Specs
          </button>
        </div>

        {/* Governor Quick Switch */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Profile:</span>
          {(['eco', 'balanced', 'performance'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPowerProfile(p)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors ${
                settings.powerProfile === p
                  ? 'bg-sky-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Real-time Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* CPU Chart */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-slate-100">Processor Utilization</span>
                  </div>
                  <span className="font-mono text-sky-400 font-bold tabular-nums text-sm">
                    {latestCpu}%
                  </span>
                </div>
                <div className="h-32 bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/80">
                  <canvas ref={cpuCanvasRef} width={340} height={120} className="w-full h-full" />
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400 font-mono">
                  <span>60 sec history</span>
                  <span>Cores: {hostSpecs?.cpuCount || navigator.hardwareConcurrency || 8}</span>
                </div>
              </div>

              {/* Memory Chart */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-100">Memory Allocation</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold tabular-nums text-sm">
                    {latestMem}%
                  </span>
                </div>
                <div className="h-32 bg-slate-900/60 rounded-lg p-1.5 border border-slate-800/80">
                  <canvas ref={memCanvasRef} width={340} height={120} className="w-full h-full" />
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400 font-mono">
                  <span>Heap footprint: ~{processes.reduce((a, b) => a + b.memoryMb, 0)} MB</span>
                  <span>Total VFS: 4.0 GB Limit</span>
                </div>
              </div>
            </div>

            {/* Quick Process Snapshot */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">Active High-Priority Threads</span>
                <span className="text-slate-400 font-mono">{processes.length} active processes</span>
              </div>
              <div className="space-y-1.5">
                {processes.slice(0, 5).map((proc) => (
                  <div
                    key={proc.pid}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">[{proc.pid}]</span>
                      <span className="text-slate-200 font-sans font-medium">{proc.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 tabular-nums">
                      <span>{proc.cpu.toFixed(1)}% CPU</span>
                      <span>{proc.memoryMb} MB RAM</span>
                      <span className="text-emerald-400 capitalize">{proc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">Process Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">CPU Usage</th>
                  <th className="py-2.5 px-3">Memory (MB)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {processes.map((proc) => (
                  <tr key={proc.pid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{proc.pid}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{proc.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 capitalize font-medium">{proc.status}</span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-sky-400">{proc.cpu.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-300">{proc.memoryMb} MB</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      {proc.pid > 4 ? (
                        <button
                          onClick={() => killProcess(proc.pid)}
                          className="px-2 py-0.5 text-xs text-rose-400 hover:bg-rose-950/60 rounded transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>End Task</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">System Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'hardware' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Host Processor Specifications</span>
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">CPU Model</span>
                  <span className="text-slate-200">{hostSpecs?.cpuModel || 'Virtual Multi-Core'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Logical Sockets/Cores</span>
                  <span className="text-slate-200">{hostSpecs?.cpuCount || navigator.hardwareConcurrency || 8}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Instruction Set Architecture</span>
                  <span className="text-slate-200">{hostSpecs?.arch || 'x86_64 / arm64'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Host Platform Kernel</span>
                  <span className="text-slate-200">{hostSpecs?.platform || 'Linux'} ({hostSpecs?.release || '6.x'})</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Memory & Compositor Telemetry</span>
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Total Physical Memory</span>
                  <span className="text-slate-200">
                    {hostSpecs ? (hostSpecs.totalMemoryBytes / 1024 / 1024 / 1024).toFixed(1) + ' GB' : '16.0 GB'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Available Free Memory</span>
                  <span className="text-slate-200">
                    {hostSpecs ? (hostSpecs.freeMemoryBytes / 1024 / 1024 / 1024).toFixed(1) + ' GB' : '9.8 GB'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Compositor Target</span>
                  <span className="text-slate-200">60 FPS Hardware V-Sync</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400 font-sans">Zero-Copy Window Snapping</span>
                  <span className="text-emerald-400">Active (sub-16ms)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
