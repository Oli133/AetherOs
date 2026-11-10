import React from 'react';
import {
  Terminal,
  Folder,
  Code,
  Cpu,
  Activity,
  Globe,
  Zap,
  Calculator,
  Image,
  Settings,
  Trash2,
} from 'lucide-react';
import { AppId } from '../os/types';
import { useSystem } from '../os/systemContext';
import { sounds } from '../os/sound';
import { APP_REGISTRY } from '../os/appRegistry';

const DOCK_APPS: AppId[] = [
  'files',
  'terminal',
  'editor',
  'cortex',
  'monitor',
  'browser',
  'benchmark',
  'calculator',
  'photos',
  'settings',
];

export default function Dock() {
  const { windows, activeWorkspace, openApp, focusWindow, restoreWindow } = useSystem();

  const handleAppClick = (appId: AppId) => {
    sounds.playClick();
    const existing = windows.find((w) => w.appId === appId && w.workspaceId === activeWorkspace);
    if (existing) {
      if (existing.isMinimized) {
        restoreWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
    } else {
      openApp(appId);
    }
  };

  const getIcon = (appId: AppId) => {
    switch (appId) {
      case 'terminal':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'files':
        return <Folder className="w-5 h-5 text-sky-400" />;
      case 'editor':
        return <Code className="w-5 h-5 text-amber-400" />;
      case 'cortex':
        return <Cpu className="w-5 h-5 text-sky-400 animate-pulse" />;
      case 'monitor':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'browser':
        return <Globe className="w-5 h-5 text-blue-400" />;
      case 'benchmark':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'calculator':
        return <Calculator className="w-5 h-5 text-purple-400" />;
      case 'photos':
        return <Image className="w-5 h-5 text-pink-400" />;
      case 'settings':
        return <Settings className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-800/90 shadow-2xl">
        {DOCK_APPS.map((appId) => {
          const meta = APP_REGISTRY[appId];
          const isOpen = windows.some((w) => w.appId === appId);
          const isWorkspaceOpen = windows.some((w) => w.appId === appId && w.workspaceId === activeWorkspace);

          return (
            <div key={appId} className="relative group">
              <button
                onClick={() => handleAppClick(appId)}
                className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 flex items-center justify-center transition-all duration-150 transform hover:-translate-y-1.5 hover:scale-110 active:scale-95 shadow-md border border-slate-800/80"
                title={meta.name}
              >
                {getIcon(appId)}
              </button>

              {/* Running dot indicator */}
              {isOpen && (
                <span
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    isWorkspaceOpen ? 'bg-sky-400 shadow-sm shadow-sky-400' : 'bg-slate-500'
                  }`}
                />
              )}

              {/* Tooltip */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                {meta.name}
              </div>
            </div>
          );
        })}

        <div className="w-[1px] h-6 bg-slate-800 mx-1" />

        {/* Trash */}
        <div className="relative group">
          <button
            onClick={() => sounds.playClick()}
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 flex items-center justify-center transition-all duration-150 transform hover:-translate-y-1 hover:scale-105 active:scale-95 border border-slate-800/80 text-slate-400 hover:text-rose-400"
            title="Trash"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            Trash (Empty)
          </div>
        </div>
      </div>
    </div>
  );
}
