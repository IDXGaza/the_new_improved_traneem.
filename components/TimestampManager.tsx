import React from 'react';
import { Timestamp } from '../types';

interface TimestampManagerProps {
  timestamps: Timestamp[];
  currentTime: number;
  onSeek: (time: number) => void;
}

const TimestampManager: React.FC<TimestampManagerProps> = ({ timestamps, currentTime, onSeek }) => {
  return (
    <div className="mt-8 space-y-2">
      <h3 className="text-lg font-bold">العلامات الزمنية</h3>
      {timestamps.length === 0 ? (
        <p className="text-gray-500">لا توجد علامات زمنية بعد.</p>
      ) : (
        timestamps.map(ts => (
          <div 
            key={ts.id} 
            onClick={() => onSeek(ts.time)}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:scale-105 transition-transform"
          >
            {ts.label} - {Math.floor(ts.time)} ثانية
          </div>
        ))
      )}
    </div>
  );
};

export default TimestampManager;
