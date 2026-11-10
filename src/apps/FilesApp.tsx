import React, { useState, useRef } from 'react';
import {
  Folder,
  File,
  FileText,
  FileCode,
  Image as ImageIcon,
  HardDrive,
  Home,
  Monitor,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  Grid,
  List,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { vfs } from '../os/filesystem';
import { FileItem } from '../os/types';
import { useSystem } from '../os/systemContext';
import { sounds } from '../os/sound';

export default function FilesApp({ initialPath = '/home/user/Desktop' }: { initialPath?: string }) {
  const { openApp, notify, refreshFs, fsVersion } = useSystem();
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-read directory items whenever currentPath or fsVersion changes
  const items = React.useMemo(() => {
    // depend on fsVersion
    if (fsVersion >= 0) {
      if (searchQuery.trim()) {
        return vfs.search(searchQuery);
      }
      return vfs.list(currentPath);
    }
    return [];
  }, [currentPath, fsVersion, searchQuery]);

  const selectedItem = selectedPath ? vfs.get(selectedPath) : null;

  const navigateTo = (path: string) => {
    setCurrentPath(vfs.normalizePath(path));
    setSelectedPath(null);
    sounds.playClick();
  };

  const handleItemClick = (item: FileItem) => {
    setSelectedPath(item.path);
    sounds.playClick();
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.isDirectory) {
      navigateTo(item.path);
    } else {
      openFile(item);
    }
  };

  const openFile = (item: FileItem) => {
    sounds.playClick();
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'svg') {
      openApp('photos', { filePath: item.path });
    } else {
      openApp('editor', { filePath: item.path });
    }
  };

  const createNewFolder = () => {
    const name = prompt('Folder name:', 'New Folder');
    if (!name) return;
    const path = `${currentPath}/${name}`;
    const ok = vfs.mkdir(path, false);
    if (ok) {
      refreshFs();
      sounds.playSuccess();
      notify('Folder Created', `Created folder ${name}`, 'success');
    } else {
      notify('Error', 'Folder already exists or invalid path', 'warn');
    }
  };

  const createNewFile = () => {
    const name = prompt('File name:', 'document.md');
    if (!name) return;
    const path = `${currentPath}/${name}`;
    vfs.writeFile(path, '# New Document\n\nCreated in AetherOS Files.');
    refreshFs();
    sounds.playSuccess();
    notify('File Created', `Created ${name}`, 'success');
    openApp('editor', { filePath: path });
  };

  const deleteSelected = () => {
    if (!selectedPath) return;
    if (confirm(`Are you sure you want to delete ${selectedPath}?`)) {
      vfs.delete(selectedPath);
      setSelectedPath(null);
      refreshFs();
      sounds.playClick();
      notify('Deleted', 'Item removed from filesystem', 'info');
    }
  };

  const downloadToHost = () => {
    if (!selectedItem || selectedItem.isDirectory) return;
    const blob = new Blob([selectedItem.content || ''], { type: selectedItem.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedItem.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sounds.playSuccess();
  };

  const handleUploadFromHost = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const targetPath = `${currentPath}/${file.name}`;
      vfs.writeFile(targetPath, content);
      refreshFs();
      sounds.playSuccess();
      notify('Uploaded File', `Imported ${file.name} into ${currentPath}`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getIconForFile = (item: FileItem) => {
    if (item.isDirectory) return <Folder className="w-5 h-5 text-sky-400 fill-sky-400/20" />;
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'sh', 'json', 'html', 'css'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-emerald-400" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
    if (['md', 'txt'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-amber-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const sidebarLinks = [
    { name: 'Desktop', path: '/home/user/Desktop', icon: Monitor },
    { name: 'Documents', path: '/home/user/Documents', icon: FileText },
    { name: 'Downloads', path: '/home/user/Downloads', icon: Download },
    { name: 'Projects', path: '/home/user/Projects', icon: FileCode },
    { name: 'Pictures', path: '/home/user/Pictures', icon: ImageIcon },
    { name: 'Home (user)', path: '/home/user', icon: Home },
    { name: 'Root System (/)', path: '/', icon: HardDrive },
  ];

  // Breadcrumbs segments
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex h-full bg-slate-900 text-slate-200 text-xs font-sans select-none">
      {/* Sidebar */}
      <div className="w-48 bg-slate-950/80 border-r border-slate-800 p-3 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Favorites
            </div>
            <nav className="space-y-0.5">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const active = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigateTo(link.path)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      active
                        ? 'bg-sky-500/15 text-sky-400 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{link.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Storage stats indicator */}
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex justify-between items-center mb-1">
            <span>VFS Storage</span>
            <span className="font-mono text-sky-400">
              {(vfs.getAllFiles().reduce((acc, f) => acc + f.sizeBytes, 0) / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-full w-[15%]" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 border-b border-slate-800 gap-2">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-xs text-slate-300">
            <button
              onClick={() => navigateTo('/')}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 font-medium text-slate-400 hover:text-white"
            >
              /
            </button>
            {pathParts.map((part, idx) => {
              const full = '/' + pathParts.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={full}>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button
                    onClick={() => navigateTo(full)}
                    className={`px-1.5 py-0.5 rounded hover:bg-slate-800 whitespace-nowrap ${
                      idx === pathParts.length - 1 ? 'text-sky-400 font-medium' : 'text-slate-300'
                    }`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 bg-slate-900 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-32 focus:w-48 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded hover:bg-slate-800 ${viewMode === 'grid' ? 'text-sky-400' : 'text-slate-400'}`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded hover:bg-slate-800 ${viewMode === 'list' ? 'text-sky-400' : 'text-slate-400'}`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={createNewFolder}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                title="New Folder"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Folder</span>
              </button>
              <button
                onClick={createNewFile}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>File</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors"
                title="Import file from host computer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUploadFromHost}
              />
            </div>
          </div>
        </div>

        {/* Files Grid / List */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onClick={() => setSelectedPath(null)}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Folder className="w-12 h-12 stroke-[1.2] mb-2 text-slate-600" />
              <p>This directory is empty</p>
              <p className="text-[11px] text-slate-600 mt-1">Create a file or upload from your computer</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {items.map((item) => {
                const isSelected = selectedPath === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    className={`flex flex-col items-center p-2 rounded-xl cursor-pointer text-center group transition-colors ${
                      isSelected
                        ? 'bg-sky-500/25 ring-1 ring-sky-400 text-white'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                  >
                    <div className="mb-1.5 p-2 rounded-lg group-hover:scale-105 transition-transform">
                      {getIconForFile(item)}
                    </div>
                    <span className="text-xs truncate max-w-full font-medium leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                      {item.isDirectory ? 'folder' : `${item.sizeBytes} B`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3">Modified</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((item) => {
                    const isSelected = selectedPath === item.path;
                    return (
                      <tr
                        key={item.path}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/20 text-white' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-2">
                          {getIconForFile(item)}
                          <span className="font-medium truncate">{item.name}</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 tabular-nums">
                          {item.isDirectory ? '-' : `${item.sizeBytes} B`}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openFile(item);
                            }}
                            className="text-slate-400 hover:text-sky-400 p-1"
                            title="Open file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Item Status / Actions Bar */}
        {selectedItem && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              {getIconForFile(selectedItem)}
              <span className="font-semibold text-slate-200">{selectedItem.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">
                {selectedItem.isDirectory ? 'Directory' : `${selectedItem.sizeBytes} bytes`}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 truncate">{selectedItem.path}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!selectedItem.isDirectory && (
                <>
                  <button
                    onClick={() => openFile(selectedItem)}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={downloadToHost}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                    title="Export file to real computer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </>
              )}
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 px-2 py-1 text-rose-400 hover:bg-rose-950/60 rounded transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
