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
      <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
        <h2 className="font-bold dark:text-white">قائمة الأغاني</h2>
        <button onClick={onClose} className="text-xl">✕</button>
      </div>
      <div className="p-4 space-y-4">
        <button onClick={toggleDarkMode} className="w-full p-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded">
          {isDarkMode ? '🌙 الوضع المظلم' : '☀️ الوضع الفاتح'}
        </button>
        <button onClick={handleCreateBackup} disabled={isProcessingBackup} className="w-full p-2 bg-blue-500 text-white rounded">
          {isProcessingBackup ? 'جاري النسخ...' : '📦 نسخة احتياطية'}
        </button>
        <div className="border-t dark:border-gray-800 pt-4">
          <p className="text-sm text-gray-500 mb-2">إضافة ملفات:</p>
          <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && onAddTrack(e.target.files[0])} className="text-xs dark:text-gray-400" />
        </div>
        <div className="mt-4 overflow-y-auto max-h-[60vh]">
          {tracks.map((track, i) => (
            <div key={track.id} onClick={() => { onSelectTrack(i); onClose(); }} className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded mb-1 dark:text-gray-200 border-b dark:border-gray-800 last:border-0">
              {track.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
            
