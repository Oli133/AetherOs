import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minus,
  Square,
  Copy,
  Terminal as TerminalIcon,
  Folder,
  Code,
  Cpu,
  Activity,
  Globe,
  Zap,
  Calculator as CalcIcon,
  Image as ImgIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import { WindowState } from '../os/types';
import { useSystem } from '../os/systemContext';
import TerminalApp from '../apps/TerminalApp';
import FilesApp from '../apps/FilesApp';
import EditorApp from '../apps/EditorApp';
import CortexApp from '../apps/CortexApp';
import MonitorApp from '../apps/MonitorApp';
import BrowserApp from '../apps/BrowserApp';
import BenchmarkApp from '../apps/BenchmarkApp';
import CalculatorApp from '../apps/CalculatorApp';
import PhotosApp from '../apps/PhotosApp';
import SettingsApp from '../apps/SettingsApp';

export default function WindowFrame({
  windowState,
  isActive,
}: {
  windowState: WindowState;
  isActive: boolean;
}) {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowBounds,
    snapWindow,
    settings,
  } = useSystem();

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, winX: 0, winY: 0 });
  const isResizingRef = useRef(false);
  const resizeDirRef = useRef<string | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0, winX: 0, winY: 0 });

  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'top' | null>(null);

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal':
        return <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Folder':
        return <Folder className="w-3.5 h-3.5 text-sky-400" />;
      case 'Code':
        return <Code className="w-3.5 h-3.5 text-amber-400" />;
      case 'Cpu':
        return <Cpu className="w-3.5 h-3.5 text-sky-400" />;
      case 'Activity':
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Globe':
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'Calculator':
        return <CalcIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'Image':
        return <ImgIcon className="w-3.5 h-3.5 text-pink-400" />;
      case 'Settings':
        return <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <Square className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    focusWindow(windowState.id);
    if (windowState.isMaximized) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      winX: windowState.x,
      winY: windowState.y,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDownResize = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    focusWindow(windowState.id);
    if (windowState.isMaximized) return;

    isResizingRef.current = true;
    resizeDirRef.current = dir;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: windowState.width,
      h: windowState.height,
      winX: windowState.x,
      winY: windowState.y,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newX = dragStartRef.current.winX + dx;
      const newY = Math.max(32, dragStartRef.current.winY + dy);

      // Check snap threshold
      if (e.clientX <= 15) {
        setSnapPreview('left');
      } else if (e.clientX >= window.innerWidth - 15) {
        setSnapPreview('right');
      } else if (e.clientY <= 36) {
        setSnapPreview('top');
      } else {
        setSnapPreview(null);
      }

      updateWindowBounds(windowState.id, { x: newX, y: newY });
    } else if (isResizingRef.current && resizeDirRef.current) {
      const dir = resizeDirRef.current;
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;
      const start = resizeStartRef.current;

      let newW = start.w;
      let newH = start.h;
      let newX = start.winX;
      let newY = start.winY;

      if (dir.includes('e')) newW = Math.max(320, start.w + dx);
      if (dir.includes('s')) newH = Math.max(200, start.h + dy);
      if (dir.includes('w')) {
        const potentialW = start.w - dx;
        if (potentialW >= 320) {
          newW = potentialW;
          newX = start.winX + dx;
        }
      }
      if (dir.includes('n')) {
        const potentialH = start.h - dy;
        if (potentialH >= 200) {
          newH = potentialH;
          newY = Math.max(32, start.winY + dy);
        }
      }

      updateWindowBounds(windowState.id, { x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (e.clientX <= 15) {
        snapWindow(windowState.id, 'left');
      } else if (e.clientX >= window.innerWidth - 15) {
        snapWindow(windowState.id, 'right');
      } else if (e.clientY <= 36) {
        snapWindow(windowState.id, 'maximize');
      }
      setSnapPreview(null);
    }
    isResizingRef.current = false;
    resizeDirRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (windowState.isMinimized) return null;

  const renderAppContent = () => {
    switch (windowState.appId) {
      case 'terminal':
        return <TerminalApp />;
      case 'files':
        return <FilesApp initialPath={windowState.customData?.currentPath} />;
      case 'editor':
        return <EditorApp filePath={windowState.customData?.filePath} />;
      case 'cortex':
        return <CortexApp />;
      case 'monitor':
        return <MonitorApp />;
      case 'browser':
        return <BrowserApp />;
      case 'benchmark':
        return <BenchmarkApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'photos':
        return <PhotosApp filePath={windowState.customData?.filePath} />;
      case 'settings':
        return <SettingsApp />;
      default:
        return <div className="p-4 text-slate-400">Application not found</div>;
    }
  };

  return (
    <>
      {/* Snap Preview Ghost Box */}
      {snapPreview && (
        <div
          className={`fixed pointer-events-none z-50 rounded-2xl bg-sky-500/15 border-2 border-sky-400/80 backdrop-blur-sm transition-all duration-150 ${
            snapPreview === 'left'
              ? 'left-2 top-10 bottom-18 w-[calc(50vw-12px)]'
              : snapPreview === 'right'
              ? 'right-2 top-10 bottom-18 w-[calc(50vw-12px)]'
              : 'left-2 right-2 top-10 bottom-18'
          }`}
        />
      )}

      {/* Main Window */}
      <div
        id={windowState.id}
        onMouseDown={() => focusWindow(windowState.id)}
        style={{
          transform: `translate3d(${windowState.x}px, ${windowState.y}px, 0)`,
          width: `${windowState.width}px`,
          height: `${windowState.height}px`,
          zIndex: windowState.zIndex,
        }}
        className={`fixed top-0 left-0 flex flex-col rounded-xl overflow-hidden shadow-2xl transition-shadow ${
          settings.animations ? 'transition-all duration-75' : ''
        } ${
          isActive
            ? 'ring-1 ring-sky-500/80 shadow-sky-950/40 shadow-2xl'
            : 'ring-1 ring-slate-800 shadow-black/60 opacity-95'
        }`}
      >
        {/* Window Titlebar */}
        <div
          onMouseDown={handleMouseDownHeader}
          onDoubleClick={() => maximizeWindow(windowState.id)}
          className={`h-9 px-3 flex items-center justify-between select-none cursor-move border-b ${
            isActive
              ? 'bg-slate-900/95 border-slate-700/80 text-slate-100'
              : 'bg-slate-950/90 border-slate-800 text-slate-400'
          }`}
        >
          {/* Left: Window Control Traffic Lights */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => closeWindow(windowState.id)}
              className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group"
              title="Close"
            >
              <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100 stroke-[3]" />
            </button>
            <button
              onClick={() => minimizeWindow(windowState.id)}
              className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center group"
              title="Minimize"
            >
              <Minus className="w-2 h-2 text-amber-950 opacity-0 group-hover:opacity-100 stroke-[3]" />
            </button>
            <button
              onClick={() => maximizeWindow(windowState.id)}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center group"
              title={windowState.isMaximized ? 'Restore' : 'Maximize'}
            >
              {windowState.isMaximized ? (
                <Copy className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100 stroke-[3]" />
              ) : (
                <Square className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100 stroke-[3]" />
              )}
            </button>
          </div>

          {/* Center: Title & Icon */}
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide truncate max-w-[60%]">
            {getAppIcon(windowState.iconName)}
            <span className="truncate">{windowState.title}</span>
          </div>

          {/* Right: Spacer for balance */}
          <div className="w-12 text-right">
            <span className="text-[10px] font-mono text-slate-500">
              {windowState.isMaximized ? '100%' : `${windowState.width}×${windowState.height}`}
            </span>
          </div>
        </div>

        {/* Window Content Body */}
        <div className="flex-1 overflow-hidden bg-slate-900 relative">
          {renderAppContent()}
        </div>

        {/* Resize Handles (8 directions) */}
        {!windowState.isMaximized && (
          <>
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'n')}
              className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 's')}
              className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'w')}
              className="absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'e')}
              className="absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'nw')}
              className="absolute top-0 left-0 w-2.5 h-2.5 cursor-nwse-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'ne')}
              className="absolute top-0 right-0 w-2.5 h-2.5 cursor-nesw-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'sw')}
              className="absolute bottom-0 left-0 w-2.5 h-2.5 cursor-nesw-resize"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'se')}
              className="absolute bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize"
            />
          </>
        )}
      </div>
    </>
  );
}
