export type AppId =
  | 'terminal'
  | 'files'
  | 'editor'
  | 'cortex'
  | 'monitor'
  | 'browser'
  | 'calculator'
  | 'photos'
  | 'settings'
  | 'benchmark';

export interface AppMetadata {
  id: AppId;
  name: string;
  category: 'System' | 'Productivity' | 'Utilities' | 'AI';
  description: string;
  iconName: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  iconName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prevBounds?: { x: number; y: number; width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  workspaceId: number;
  customData?: any;
}

export interface OSProcess {
  pid: number;
  appId: AppId;
  name: string;
  cpu: number;
  memoryMb: number;
  startedAt: number;
  status: 'running' | 'idle' | 'sleeping';
}

export interface FileItem {
  id: string;
  name: string;
  path: string; // e.g. /home/user/Documents/notes.txt
  isDirectory: boolean;
  content?: string;
  sizeBytes: number;
  updatedAt: number;
  mimeType?: string;
}

export type PowerProfile = 'eco' | 'balanced' | 'performance';

export interface OSSettings {
  theme: 'dark' | 'light';
  accentColor: string; // hex or tailwind class
  wallpaperId: string;
  customWallpaperUrl?: string;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  powerProfile: PowerProfile;
  animations: boolean;
  dockPosition: 'bottom' | 'left';
  dockAutoHide: boolean;
}
