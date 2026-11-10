import React from 'react';
import { SystemProvider } from './os/systemContext';
import TopBar from './components/TopBar';
import DesktopCanvas from './components/DesktopCanvas';
import Dock from './components/Dock';
import SpotlightModal from './components/SpotlightModal';

export default function App() {
  return (
    <SystemProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-100 select-none">
        {/* Fixed System Menu Bar */}
        <TopBar />

        {/* Dynamic Desktop Workspace Canvas */}
        <DesktopCanvas />

        {/* Modern Floating Dock */}
        <Dock />

        {/* Global Spotlight Search Overlay (Cmd+Space / Ctrl+Space) */}
        <SpotlightModal />
      </div>
    </SystemProvider>
  );
}
