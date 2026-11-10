import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Monitor, Check } from 'lucide-react';
import { useSystem } from '../os/systemContext';
import { sounds } from '../os/sound';

export const SYSTEM_WALLPAPERS = [
  {
    id: 'obsidian-nebula',
    name: 'Obsidian Nebula',
    gradient: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
    previewColor: '#1e1b4b',
  },
  {
    id: 'deep-space',
    name: 'Cosmic Titanium',
    gradient: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e293b 100%)',
    previewColor: '#111827',
  },
  {
    id: 'aurora-borealis',
    name: 'Midnight Aurora',
    gradient: 'linear-gradient(160deg, #022c22 0%, #064e3b 30%, #0f172a 70%, #020617 100%)',
    previewColor: '#064e3b',
  },
  {
    id: 'cyber-slate',
    name: 'Argon Cyber Slate',
    gradient: 'radial-gradient(circle at 80% 80%, #0c4a6e 0%, #082f49 35%, #020617 100%)',
    previewColor: '#0c4a6e',
  },
  {
    id: 'solar-minimal',
    name: 'Solar Flare Minimal',
    gradient: 'linear-gradient(135deg, #451a03 0%, #1c1917 40%, #0c0a09 100%)',
    previewColor: '#451a03',
  },
];

export default function PhotosApp({ filePath }: { filePath?: string }) {
  const { settings, updateSettings, notify } = useSystem();
  const [selectedWallpaper, setSelectedWallpaper] = useState(settings.wallpaperId);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const activeWall = SYSTEM_WALLPAPERS.find((w) => w.id === selectedWallpaper) || SYSTEM_WALLPAPERS[0];

  const handleApplyWallpaper = () => {
    updateSettings({ wallpaperId: selectedWallpaper, customWallpaperUrl: undefined });
    sounds.playSuccess();
    notify('Wallpaper Updated', `Applied "${activeWall.name}" as desktop wallpaper.`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs font-sans select-none">
      {/* Top Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{activeWall.name}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono">{zoom}%</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(250, z + 15))}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Rotate"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleApplyWallpaper}
            className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors ml-2"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Set as Wallpaper</span>
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="flex-1 overflow-hidden p-6 flex items-center justify-center bg-black/80">
        <div
          className="w-full max-w-lg aspect-video rounded-2xl shadow-2xl transition-all duration-200 border border-slate-800 flex items-center justify-center relative overflow-hidden"
          style={{
            background: activeWall.gradient,
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          }}
        >
          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="text-center z-10 p-4">
            <div className="text-2xl font-bold tracking-tight text-white drop-shadow-md">AetherOS</div>
            <div className="text-xs text-sky-200/80 font-mono mt-1">4.2 LTS Desktop Edition</div>
          </div>
        </div>
      </div>

      {/* Bottom Wallpaper Carousel */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-3 overflow-x-auto">
        {SYSTEM_WALLPAPERS.map((wall) => {
          const isSelected = selectedWallpaper === wall.id;
          const isCurrent = settings.wallpaperId === wall.id;
          return (
            <div
              key={wall.id}
              onClick={() => {
                setSelectedWallpaper(wall.id);
                sounds.playClick();
              }}
              className={`flex-shrink-0 cursor-pointer rounded-xl p-1 transition-all ${
                isSelected ? 'ring-2 ring-sky-400' : 'hover:opacity-90'
              }`}
            >
              <div
                className="w-24 h-14 rounded-lg relative overflow-hidden shadow-inner flex items-end p-1 text-[10px] font-medium text-white"
                style={{ background: wall.gradient }}
              >
                {isCurrent && (
                  <span className="absolute top-1 right-1 bg-sky-500 rounded-full p-0.5">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
                <span className="truncate drop-shadow">{wall.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
