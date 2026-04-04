import React from 'react';
import { Track } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onSelectTrack: (index: number) => void;
  onAddTrack: (file: File) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleCreateBackup: () => Promise<void>;
  isProcessingBackup: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose, tracks, onSelectTrack, onAddTrack, 
  isDarkMode, toggleDarkMode, handleCreateBackup, isProcessingBackup 
}) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}>
      <div className="p-4 border-b dark:border-gray-800 flex justify-between">
        <h2 className="font-bold">القائمة</h2>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="p-4 space-y-4">
        <button onClick={toggleDarkMode} className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded">
          {isDarkMode ? 'الوضع الفاتح' : 'الوضع المظلم'}
        </button>
        <button onClick={handleCreateBackup} disabled={isProcessingBackup} className="w-full p-2 bg-blue-500 text-white rounded">
          {isProcessingBackup ? 'جاري النسخ...' : 'نسخة احتياطية'}
        </button>
        <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && onAddTrack(e.target.files[0])} className="text-xs" />
        <div className="mt-4">
          {tracks.map((track, i) => (
            <div key={track.id} onClick={() => onSelectTrack(i)} className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              {track.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
