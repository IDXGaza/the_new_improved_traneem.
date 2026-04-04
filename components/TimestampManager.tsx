import React from 'react';
import { Timestamp } from '../types';

interface TimestampManagerProps {
  timestamps: Timestamp[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const TimestampManager: React.FC<TimestampManagerProps> = ({ timestamps, currentTime, onSeek }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-8 text-right">
      <h3 className="text-xl font-bold mb-4 dark:text-white">العلامات الزمنية</h3>
      <div className="grid grid-cols-1 gap-2">
        {timestamps.length > 0 ? (
          timestamps.map((ts) => (
            <button
              key={ts.id}
              onClick={() => onSeek(ts.time)}
              className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all border border-transparent hover:border-blue-200"
            >
              <span className="text-blue-500 font-mono">{formatTime(ts.time)}</span>
              <span className="font-medium dark:text-gray-200">{ts.label}</span>
            </button>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">لا توجد علامات زمنية مضافة.</p>
        )}
      </div>
    </div>
  );
};

export default TimestampManager;
