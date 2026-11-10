import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  Volume2,
  VolumeX,
  Sliders,
  Search,
  Zap,
  Calendar as CalendarIcon,
  Moon,
  Sun,
  Power,
  RotateCw,
} from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { APP_REGISTRY } from '../os/appRegistry';
import { sounds } from '../os/sound';

export default function TopBar() {
  const {
    activeWindowId,
    windows,
    activeWorkspace,
    setActiveWorkspace,
    settings,
    updateSettings,
    toggleTheme,
    setPowerProfile,
    setSpotlightOpen,
    openApp,
  } = useSystem();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState<boolean>(false);
  const [isVolumePopoverOpen, setIsVolumePopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const activeAppMeta = activeWindow ? APP_REGISTRY[activeWindow.appId] : null;

  return (
    <header className="h-8 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-3 flex items-center justify-between text-xs text-slate-200 select-none z-50 fixed top-0 left-0 right-0">
      {/* Zone 1: Brand & Active App Context Menu */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative">
          <button
            onClick={() => {
              setIsMenuOpen((o) => !o);
              sounds.playClick();
            }}
            className="flex items-center gap-1.5 font-bold tracking-tight text-white hover:text-sky-400 transition-colors px-1.5 py-0.5 rounded"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm shadow-sky-400/50" />
            <span className="font-sans">AetherOS</span>
          </button>

          {/* System Dropdown */}
          {isMenuOpen && (
            <div
              className="absolute left-0 top-full mt-1 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-0.5 z-50 text-xs"
              onClick={() => setIsMenuOpen(false)}
            >
              <button
                onClick={() => openApp('settings')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
              >
                About AetherOS Workstation
              </button>
              <button
                onClick={() => openApp('settings')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
              >
                System Preferences...
              </button>
              <button
                onClick={() => openApp('monitor')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
              >
                Task Monitor & Threads
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => window.location.reload()}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <RotateCw className="w-3 h-3 text-sky-400" />
                <span>Restart Desktop Session</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Application Title & Menus */}
        <div className="hidden sm:flex items-center gap-3 text-slate-300 font-medium text-xs">
          <span className="font-semibold text-white">
            {activeAppMeta ? activeAppMeta.name : 'Desktop'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">File</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Edit</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">View</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Window</span>
          <span className="text-slate-400 hover:text-slate-200 cursor-pointer">Help</span>
        </div>
      </div>

      {/* Zone 2: Virtual Workspace Switcher (Desktops 1, 2, 3) */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/80">
        {[1, 2, 3].map((num) => {
          const isActive = activeWorkspace === num;
          const countInWorkspace = windows.filter((w) => w.workspaceId === num).length;
          return (
            <button
              key={num}
              onClick={() => {
                setActiveWorkspace(num);
                sounds.playClick();
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1 ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={`Switch to Desktop ${num} (Alt+${num})`}
            >
              <span>D{num}</span>
              {countInWorkspace > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Zone 3: System Status Indicators & Clock */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Cognition Kernel indicator */}
        <button
          onClick={() => openApp('cortex')}
          className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-mono bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 px-2 py-0.5 rounded transition-colors"
          title="Cognition Kernel: High Thinking Active"
        >
          <Cpu className="w-3 h-3 text-sky-400" />
          <span className="hidden md:inline">High Thinking</span>
        </button>

        {/* Governor Profile */}
        <button
          onClick={() => openApp('monitor')}
          className="hidden lg:flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-mono bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded capitalize"
          title={`Power Profile: ${settings.powerProfile}`}
        >
          <Zap className="w-3 h-3" />
          <span>{settings.powerProfile}</span>
        </button>

        {/* Spotlight Trigger */}
        <button
          onClick={() => {
            setSpotlightOpen(true);
            sounds.playClick();
          }}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          title="Spotlight Search (Cmd+Space)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Volume popover */}
        <div className="relative">
          <button
            onClick={() => setIsVolumePopoverOpen((o) => !o)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Audio Volume"
          >
            {settings.soundEnabled && settings.soundVolume > 0 ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            )}
          </button>
          {isVolumePopoverOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50">
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                <span>Sound Level</span>
                <span className="font-mono text-sky-400">
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
          )}
        </div>

        {/* WiFi indicator */}
        <Wifi className="w-3.5 h-3.5 text-slate-400" />

        {/* Date & Time */}
        <div className="relative">
          <button
            onClick={() => {
              setIsCalendarOpen((o) => !o);
              sounds.playClick();
            }}
            className="flex items-center gap-1.5 text-slate-200 hover:text-white font-mono text-xs px-1.5 py-0.5 rounded hover:bg-slate-850 transition-colors"
          >
            <span className="hidden sm:inline text-slate-400">{dateStr}</span>
            <span className="font-bold tabular-nums">{timeStr}</span>
          </button>

          {/* Calendar Flyout */}
          {isCalendarOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-200 mb-2 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{timeStr}</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-slate-400 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate();
                  return (
                    <span
                      key={day}
                      className={`p-1 rounded ${
                        isToday
                          ? 'bg-sky-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Control Center Button */}
        <div className="relative">
          <button
            onClick={() => {
              setIsControlCenterOpen((o) => !o);
              sounds.playClick();
            }}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Control Center"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Quick Settings Control Center Modal */}
          {isControlCenterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-68 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-slate-200">
                <span>Quick Control Center</span>
                <button
                  onClick={() => setIsControlCenterOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors"
                >
                  {settings.theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="capitalize">{settings.theme} Mode</span>
                </button>

                <button
                  onClick={() =>
                    setPowerProfile(
                      settings.powerProfile === 'eco'
                        ? 'balanced'
                        : settings.powerProfile === 'balanced'
                        ? 'performance'
                        : 'eco'
                    )
                  }
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="capitalize">{settings.powerProfile}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Display Scaled Density</span>
                  <span className="font-mono text-sky-400">100% Native</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Sound Synthesizer</span>
                  <span className="text-emerald-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
