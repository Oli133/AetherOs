import React, { useState } from 'react';
import {
  Palette,
  Volume2,
  Zap,
  HardDrive,
  Info,
  Check,
  RotateCcw,
  Download,
  Upload,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { SYSTEM_WALLPAPERS } from './PhotosApp';
import { vfs } from '../os/filesystem';
import { sounds } from '../os/sound';

export default function SettingsApp() {
  const { settings, updateSettings, toggleTheme, setPowerProfile, notify, refreshFs } = useSystem();
  const [activeNav, setActiveNav] = useState<'appearance' | 'performance' | 'sound' | 'storage' | 'about'>('appearance');

  const accentColors = [
    { name: 'Sky Cyan', hex: '#38bdf8' },
    { name: 'Emerald Cyber', hex: '#34d399' },
    { name: 'Royal Indigo', hex: '#818cf8' },
    { name: 'Amber Sunset', hex: '#fbbf24' },
    { name: 'Rose Titanium', hex: '#fb7185' },
  ];

  const handleBackupExport = () => {
    const json = vfs.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aetheros_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sounds.playSuccess();
    notify('Backup Exported', 'Full VFS snapshot downloaded to host machine.', 'success');
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = vfs.importBackup(content);
      if (ok) {
        refreshFs();
        sounds.playSuccess();
        notify('Backup Restored', 'Filesystem loaded from backup JSON.', 'success');
      } else {
        notify('Import Failed', 'Invalid backup file structure.', 'warn');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetVfs = () => {
    if (confirm('Are you sure you want to reset the AetherOS filesystem to factory defaults? All created files will be cleared.')) {
      vfs.resetToDefaults();
      refreshFs();
      sounds.playSuccess();
      notify('Factory Reset', 'VFS restored to clean initial state.', 'info');
    }
  };

  const navItems = [
    { id: 'appearance', name: 'Appearance & Themes', icon: Palette },
    { id: 'performance', name: 'Performance & Governor', icon: Zap },
    { id: 'sound', name: 'Audio & Haptics', icon: Volume2 },
    { id: 'storage', name: 'Storage & Backup', icon: HardDrive },
    { id: 'about', name: 'About AetherOS', icon: Info },
  ] as const;

  return (
    <div className="flex h-full bg-slate-900 text-slate-200 text-xs font-sans select-none">
      {/* Sidebar navigation */}
      <div className="w-52 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1 shrink-0">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          System Preferences
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                sounds.playClick();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Panel Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeNav === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Color Theme Mode</h3>
              <p className="text-slate-400 text-xs mb-3">
                Switch between high-contrast dark workstation mode and clean daylight mode.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (settings.theme !== 'dark') toggleTheme();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-4 h-4 text-sky-400" />
                  <span>Dark Obsidian</span>
                </button>
                <button
                  onClick={() => {
                    if (settings.theme !== 'light') toggleTheme();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    settings.theme === 'light'
                      ? 'bg-white border-sky-500 text-slate-900 shadow-sm font-semibold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Daylight</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">System Accent Color</h3>
              <p className="text-slate-400 text-xs mb-3">Concentrated accent tint for active window borders and controls.</p>
              <div className="flex items-center gap-2">
                {accentColors.map((color) => {
                  const isSelected = settings.accentColor === color.hex;
                  return (
                    <button
                      key={color.hex}
                      onClick={() => {
                        updateSettings({ accentColor: color.hex });
                        sounds.playClick();
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Desktop Background</h3>
              <p className="text-slate-400 text-xs mb-3">Choose from curated architectural gradients.</p>
              <div className="grid grid-cols-3 gap-3">
                {SYSTEM_WALLPAPERS.map((wall) => {
                  const isSelected = settings.wallpaperId === wall.id;
                  return (
                    <div
                      key={wall.id}
                      onClick={() => {
                        updateSettings({ wallpaperId: wall.id, customWallpaperUrl: undefined });
                        sounds.playSuccess();
                      }}
                      className={`h-20 rounded-xl cursor-pointer p-2 flex flex-col justify-end relative overflow-hidden transition-all ${
                        isSelected ? 'ring-2 ring-sky-400' : 'hover:opacity-90'
                      }`}
                      style={{ background: wall.gradient }}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-sky-500 rounded-full p-0.5 shadow">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-white drop-shadow truncate">
                        {wall.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeNav === 'performance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Power & Performance Governor</h3>
              <p className="text-slate-400 text-xs mb-3">
                Dynamically adjust window compositor throttling and background worker cycles.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'eco',
                    name: 'Eco Mode',
                    desc: 'Minimizes CPU cycles and throttles animation updates for battery longevity.',
                    badge: 'Low Overhead',
                  },
                  {
                    id: 'balanced',
                    name: 'Balanced',
                    desc: 'Smooth 60 FPS compositor with intelligent resource scheduling.',
                    badge: 'Recommended',
                  },
                  {
                    id: 'performance',
                    name: 'High Performance',
                    desc: 'Uncapped compositor frame rate and instant thread pre-allocation.',
                    badge: 'Max Throughput',
                  },
                ].map((prof) => {
                  const isSelected = settings.powerProfile === prof.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => setPowerProfile(prof.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                        <span>{prof.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{prof.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Compositor Smooth Transitions</div>
                <div className="text-[11px] text-slate-400">Enable fluid window resizing and minimizing animations.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.animations}
                onChange={(e) => updateSettings({ animations: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded"
              />
            </div>
          </div>
        )}

        {activeNav === 'sound' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Synthetic Audio Engine</h3>
              <p className="text-slate-400 text-xs mb-3">
                Real-time Web Audio API synthesizer for window cues and terminal feedback.
              </p>
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">System Sound Effects</div>
                    <div className="text-[11px] text-slate-400">Play subtle auditory cues on window events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span className="text-slate-400">Master Volume</span>
                    <span className="font-mono text-sky-400 tabular-nums">
                      {Math.round(settings.soundVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => sounds.playWindowOpen()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                  >
                    Test Window Chime
                  </button>
                  <button
                    onClick={() => sounds.playSuccess()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                  >
                    Test Success Fanfare
                  </button>
                  <button
                    onClick={() => sounds.playBell()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                  >
                    Test Bell
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'storage' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Virtual Storage Management</h3>
              <p className="text-slate-400 text-xs mb-3">
                Backup, export, or restore your AetherOS virtual filesystem state.
              </p>
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="font-semibold text-slate-200">Filesystem Backup & Portability</div>
                    <div className="text-[11px] text-slate-400">Export all virtual files as a structured JSON snapshot.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBackupExport}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded text-white cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Restore Backup</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleBackupImport}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-semibold text-rose-400">Factory Reset Filesystem</div>
                    <div className="text-[11px] text-slate-500">Revert all user folders and system logs to fresh state.</div>
                  </div>
                  <button
                    onClick={handleResetVfs}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset VFS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'about' && (
          <div className="space-y-4 max-w-xl">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-slate-800 shadow-lg text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl mb-3">
                Æ
              </div>
              <h2 className="text-xl font-bold text-white">AetherOS Desktop Workstation</h2>
              <p className="text-sky-400 font-mono text-xs mt-1">Version 4.2 LTS (Build 2026.11)</p>
              <div className="mt-4 text-xs text-slate-400 max-w-md leading-relaxed">
                An ultra-responsive, lightweight operating system built for desktop multitasking with zero-latency window management and native Gemini High-Thinking intelligence.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 font-sans">Microkernel Target</span>
                <span className="text-slate-200">Aether-rt Low-Latency Scheduler</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 font-sans">Cognition Subsystem</span>
                <span className="text-sky-400">Gemini 3.8 / 4 High Thinking</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 font-sans">Window Compositor</span>
                <span className="text-slate-200">GPU Hardware-Accelerated CSS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Execution License</span>
                <span className="text-slate-200">Apache 2.0 / Open Workstation</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
