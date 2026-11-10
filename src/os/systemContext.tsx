import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppId, WindowState, OSProcess, OSSettings, PowerProfile } from './types';
import { APP_REGISTRY } from './appRegistry';
import { vfs } from './filesystem';
import { sounds } from './sound';

interface SystemContextType {
  windows: WindowState[];
  activeWindowId: string | null;
  activeWorkspace: number;
  processes: OSProcess[];
  settings: OSSettings;
  isSpotlightOpen: boolean;
  fsVersion: number; // incremented whenever files change
  notifications: Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warn' }>;

  // Window operations
  openApp: (appId: AppId, customData?: any) => string;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowBounds: (windowId: string, bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => void;
  snapWindow: (windowId: string, snapType: 'left' | 'right' | 'top' | 'maximize') => void;

  // Workspace
  setActiveWorkspace: (id: number) => void;

  // Settings
  updateSettings: (updates: Partial<OSSettings>) => void;
  toggleTheme: () => void;
  setPowerProfile: (profile: PowerProfile) => void;

  // Processes
  killProcess: (pid: number) => void;

  // Utilities
  setSpotlightOpen: (open: boolean) => void;
  notify: (title: string, message: string, type?: 'info' | 'success' | 'warn') => void;
  refreshFs: () => void;
}

const DEFAULT_SETTINGS: OSSettings = {
  theme: 'dark',
  accentColor: '#38bdf8', // Sky blue
  wallpaperId: 'obsidian-nebula',
  soundEnabled: true,
  soundVolume: 0.5,
  powerProfile: 'balanced',
  animations: true,
  dockPosition: 'bottom',
  dockAutoHide: false,
};

const SystemContext = createContext<SystemContextType | null>(null);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<number>(1);
  const [processes, setProcesses] = useState<OSProcess[]>([
    { pid: 1, appId: 'settings', name: 'init/systemd', cpu: 0.1, memoryMb: 12.4, startedAt: Date.now() - 3600000, status: 'running' },
    { pid: 2, appId: 'settings', name: 'aether-compositor', cpu: 0.8, memoryMb: 24.1, startedAt: Date.now() - 3600000, status: 'running' },
    { pid: 3, appId: 'cortex', name: 'cognition-kernel-daemon', cpu: 0.2, memoryMb: 36.8, startedAt: Date.now() - 3600000, status: 'sleeping' },
    { pid: 4, appId: 'files', name: 'vfs-block-allocator', cpu: 0.05, memoryMb: 8.2, startedAt: Date.now() - 3600000, status: 'running' },
  ]);

  const [settings, setSettings] = useState<OSSettings>(() => {
    try {
      const saved = localStorage.getItem('aether_os_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSpotlightOpen, setSpotlightOpen] = useState(false);
  const [fsVersion, setFsVersion] = useState(0);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warn' }>>([]);

  const refreshFs = useCallback(() => {
    setFsVersion((v) => v + 1);
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    sounds.enabled = settings.soundEnabled;
    sounds.volume = settings.soundVolume;
  }, [settings.theme, settings.soundEnabled, settings.soundVolume]);

  const updateSettings = useCallback((updates: Partial<OSSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('aether_os_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  }, [settings.theme, updateSettings]);

  const setPowerProfile = useCallback((profile: PowerProfile) => {
    updateSettings({ powerProfile: profile });
    sounds.playClick();
  }, [updateSettings]);

  const notify = useCallback((title: string, message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setNotifications((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  // Get next highest zIndex
  const getNextZIndex = useCallback(() => {
    if (windows.length === 0) return 10;
    return Math.max(...windows.map((w) => w.zIndex), 9) + 1;
  }, [windows]);

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const target = prev.find((w) => w.id === windowId);
      if (!target) return prev;
      const nextZ = Math.max(...prev.map((w) => w.zIndex), 9) + 1;
      return prev.map((w) => (w.id === windowId ? { ...w, zIndex: nextZ, isMinimized: false } : w));
    });
    setActiveWindowId(windowId);
  }, []);

  const openApp = useCallback((appId: AppId, customData?: any): string => {
    const meta = APP_REGISTRY[appId];
    if (!meta) return '';

    // Check if app already has a window in current workspace and is not multi-instance
    const existing = windows.find((w) => w.appId === appId && w.workspaceId === activeWorkspace && !customData?.newWindow);
    if (existing) {
      if (existing.isMinimized) {
        setWindows((prev) =>
          prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: false, zIndex: getNextZIndex() } : w))
        );
      } else {
        focusWindow(existing.id);
      }
      sounds.playClick();
      return existing.id;
    }

    sounds.playWindowOpen();

    // Calculate smart cascaded position
    const offset = (windows.length % 6) * 28;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;

    const width = Math.min(meta.defaultWidth, screenW - 80);
    const height = Math.min(meta.defaultHeight, screenH - 140);
    const x = Math.max(30, Math.min(screenW - width - 40, 100 + offset));
    const y = Math.max(48, Math.min(screenH - height - 80, 50 + offset));

    const id = `win-${appId}-${Date.now()}`;
    const newWindow: WindowState = {
      id,
      appId,
      title: customData?.title || meta.name,
      iconName: meta.iconName,
      x,
      y,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
      zIndex: getNextZIndex(),
      workspaceId: activeWorkspace,
      customData,
    };

    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(id);

    // Register process in task monitor
    const pid = 100 + Math.floor(Math.random() * 899);
    setProcesses((prev) => [
      ...prev,
      {
        pid,
        appId,
        name: meta.name.toLowerCase().replace(/\s+/g, '-'),
        cpu: parseFloat((Math.random() * 2.5 + 0.5).toFixed(1)),
        memoryMb: Math.floor(Math.random() * 35 + 20),
        startedAt: Date.now(),
        status: 'running',
      },
    ]);

    return id;
  }, [activeWorkspace, focusWindow, getNextZIndex, windows]);

  const closeWindow = useCallback((windowId: string) => {
    sounds.playWindowClose();
    setWindows((prev) => {
      const closing = prev.find((w) => w.id === windowId);
      const remaining = prev.filter((w) => w.id !== windowId);
      if (closing) {
        // Remove process
        setProcesses((procPrev) => {
          const idx = procPrev.findIndex((p) => p.appId === closing.appId);
          if (idx !== -1) {
            return procPrev.filter((_, i) => i !== idx);
          }
          return procPrev;
        });
      }
      return remaining;
    });

    if (activeWindowId === windowId) {
      // Focus top remaining window in workspace
      const remaining = windows.filter((w) => w.id !== windowId && w.workspaceId === activeWorkspace && !w.isMinimized);
      if (remaining.length > 0) {
        const top = remaining.reduce((prev, curr) => (curr.zIndex > prev.zIndex ? curr : prev));
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [activeWindowId, activeWorkspace, windows]);

  const minimizeWindow = useCallback((windowId: string) => {
    sounds.playClick();
    setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w)));
    if (activeWindowId === windowId) {
      const remaining = windows.filter((w) => w.id !== windowId && w.workspaceId === activeWorkspace && !w.isMinimized);
      if (remaining.length > 0) {
        const top = remaining.reduce((prev, curr) => (curr.zIndex > prev.zIndex ? curr : prev));
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [activeWindowId, activeWorkspace, windows]);

  const maximizeWindow = useCallback((windowId: string) => {
    sounds.playClick();
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== windowId) return w;
        if (w.isMaximized) {
          // Restore
          return {
            ...w,
            isMaximized: false,
            x: w.prevBounds?.x ?? w.x,
            y: w.prevBounds?.y ?? w.y,
            width: w.prevBounds?.width ?? w.width,
            height: w.prevBounds?.height ?? w.height,
          };
        } else {
          // Maximize to full desktop minus top bar and dock
          const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
          const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
          return {
            ...w,
            isMaximized: true,
            prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
            x: 0,
            y: 32, // top bar height
            width: screenW,
            height: screenH - 32 - 64, // top bar + dock height
          };
        }
      })
    );
  }, []);

  const restoreWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== windowId) return w;
        return {
          ...w,
          isMinimized: false,
          zIndex: getNextZIndex(),
        };
      })
    );
    setActiveWindowId(windowId);
  }, [getNextZIndex]);

  const updateWindowBounds = useCallback((windowId: string, bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== windowId) return w;
        return {
          ...w,
          ...bounds,
          isMaximized: false, // moving or resizing breaks maximized state
        };
      })
    );
  }, []);

  const snapWindow = useCallback((windowId: string, snapType: 'left' | 'right' | 'top' | 'maximize') => {
    sounds.playClick();
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
    const topBarH = 32;
    const dockH = 64;
    const availH = screenH - topBarH - dockH;

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== windowId) return w;
        const prevBounds = w.isMaximized || w.prevBounds ? w.prevBounds : { x: w.x, y: w.y, width: w.width, height: w.height };

        if (snapType === 'left') {
          return {
            ...w,
            isMaximized: false,
            prevBounds,
            x: 0,
            y: topBarH,
            width: Math.floor(screenW / 2),
            height: availH,
          };
        } else if (snapType === 'right') {
          return {
            ...w,
            isMaximized: false,
            prevBounds,
            x: Math.floor(screenW / 2),
            y: topBarH,
            width: Math.ceil(screenW / 2),
            height: availH,
          };
        } else {
          return {
            ...w,
            isMaximized: true,
            prevBounds,
            x: 0,
            y: topBarH,
            width: screenW,
            height: availH,
          };
        }
      })
    );
  }, []);

  const killProcess = useCallback((pid: number) => {
    sounds.playClick();
    setProcesses((prev) => {
      const proc = prev.find((p) => p.pid === pid);
      if (proc) {
        // If it's an app window, close its windows
        setWindows((winPrev) => winPrev.filter((w) => w.appId !== proc.appId));
      }
      return prev.filter((p) => p.pid !== pid);
    });
    notify('Process Terminated', `Process [PID ${pid}] was stopped by user request.`, 'warn');
  }, [notify]);

  // Global hotkeys: Cmd+Space or Ctrl+Space for Spotlight, Alt+1/2/3 for Workspaces
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        setSpotlightOpen((open) => !open);
      }
      if (e.altKey && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        e.preventDefault();
        const num = parseInt(e.code.replace('Digit', ''), 10);
        setActiveWorkspace(num);
        sounds.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open default Welcome Readme & Cognition Kernel or Terminal on initial mount
  useEffect(() => {
    const initialized = sessionStorage.getItem('aether_os_inited');
    if (!initialized) {
      sessionStorage.setItem('aether_os_inited', 'true');
      // Open Welcome File and Cognition Kernel
      setTimeout(() => {
        openApp('cortex');
      }, 250);
      setTimeout(() => {
        openApp('files', { currentPath: '/home/user/Desktop' });
      }, 500);
    }
  }, [openApp]);

  return (
    <SystemContext.Provider
      value={{
        windows,
        activeWindowId,
        activeWorkspace,
        processes,
        settings,
        isSpotlightOpen,
        fsVersion,
        notifications,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        focusWindow,
        updateWindowBounds,
        snapWindow,
        setActiveWorkspace,
        updateSettings,
        toggleTheme,
        setPowerProfile,
        killProcess,
        setSpotlightOpen,
        notify,
        refreshFs,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within SystemProvider');
  return ctx;
}
