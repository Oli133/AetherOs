import React, { useState } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  Terminal,
  Activity,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Monitor,
} from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { SYSTEM_WALLPAPERS } from '../apps/PhotosApp';
import WindowFrame from './WindowFrame';
import { vfs } from '../os/filesystem';
import { FileItem } from '../os/types';
import { sounds } from '../os/sound';

export default function DesktopCanvas() {
  const {
    windows,
    activeWindowId,
    activeWorkspace,
    settings,
    openApp,
    notifications,
    refreshFs,
    fsVersion,
  } = useSystem();

  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Desktop files from /home/user/Desktop
  const desktopFiles = React.useMemo(() => {
    if (fsVersion >= 0) {
      return vfs.list('/home/user/Desktop');
    }
    return [];
  }, [fsVersion]);

  // Current wallpaper
  const activeWallpaper =
    SYSTEM_WALLPAPERS.find((w) => w.id === settings.wallpaperId) || SYSTEM_WALLPAPERS[0];

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    sounds.playClick();
  };

  const handleOpenDesktopFile = (item: FileItem) => {
    sounds.playClick();
    if (item.isDirectory) {
      openApp('files', { currentPath: item.path });
    } else {
      const ext = item.name.split('.').pop()?.toLowerCase();
      if (ext === 'sh') {
        openApp('terminal');
      } else {
        openApp('editor', { filePath: item.path });
      }
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) return <Folder className="w-8 h-8 text-sky-400 fill-sky-400/20" />;
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (ext === 'sh' || ext === 'js' || ext === 'py') {
      return <FileCode className="w-8 h-8 text-emerald-400" />;
    }
    return <FileText className="w-8 h-8 text-amber-400" />;
  };

  // Windows in current workspace
  const currentWorkspaceWindows = windows.filter((w) => w.workspaceId === activeWorkspace);

  return (
    <div
      onContextMenu={handleDesktopContextMenu}
      onClick={() => {
        setSelectedDesktopIcon(null);
        setContextMenu(null);
      }}
      className="fixed inset-0 pt-8 pb-16 overflow-hidden select-none"
      style={{
        background: settings.customWallpaperUrl
          ? `url(${settings.customWallpaperUrl}) center/cover no-repeat`
          : activeWallpaper.gradient,
      }}
    >
      {/* Subtle grid pattern overlay for high-tech desktop texture */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Desktop Grid of Icons */}
      <div className="absolute top-12 left-4 flex flex-col flex-wrap gap-4 max-h-[80vh] z-0">
        {desktopFiles.map((file) => {
          const isSelected = selectedDesktopIcon === file.path;
          return (
            <div
              key={file.path}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDesktopIcon(file.path);
                sounds.playClick();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleOpenDesktopFile(file);
              }}
              className={`w-24 p-2 rounded-xl flex flex-col items-center text-center cursor-pointer group transition-colors ${
                isSelected
                  ? 'bg-sky-500/25 ring-1 ring-sky-400 text-white'
                  : 'hover:bg-black/25 text-slate-200'
              }`}
            >
              <div className="mb-1 drop-shadow-md group-hover:scale-105 transition-transform">
                {getFileIcon(file)}
              </div>
              <span className="text-[11px] font-medium leading-snug drop-shadow line-clamp-2 max-w-full">
                {file.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Render Workspace Windows */}
      {currentWorkspaceWindows.map((win) => (
        <WindowFrame
          key={win.id}
          windowState={win}
          isActive={win.id === activeWindowId}
        />
      ))}

      {/* Right-Click Desktop Context Menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-48 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-200"
        >
          <button
            onClick={() => {
              const name = prompt('New Folder name:', 'New Folder');
              if (name) {
                vfs.mkdir(`/home/user/Desktop/${name}`, false);
                refreshFs();
                sounds.playSuccess();
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
          >
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => {
              const name = prompt('New File name:', 'notes.md');
              if (name) {
                vfs.writeFile(`/home/user/Desktop/${name}`, '# New Document\n');
                refreshFs();
                sounds.playSuccess();
                openApp('editor', { filePath: `/home/user/Desktop/${name}` });
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>New Text Document</span>
          </button>
          <div className="border-t border-slate-800 my-1" />
          <button
            onClick={() => {
              openApp('terminal');
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Terminal Here</span>
          </button>
          <button
            onClick={() => {
              openApp('benchmark');
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Run Benchmark</span>
          </button>
          <button
            onClick={() => {
              openApp('photos');
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2"
          >
            <Monitor className="w-3.5 h-3.5 text-purple-400" />
            <span>Change Wallpaper...</span>
          </button>
        </div>
      )}

      {/* System Toast Notifications */}
      <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl text-xs text-slate-100 flex items-start gap-2.5 pointer-events-auto transition-all animate-in slide-in-from-right"
          >
            {notif.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : notif.type === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-slate-200">{notif.title}</div>
              <div className="text-slate-400 text-[11px] mt-0.5 leading-snug">{notif.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
