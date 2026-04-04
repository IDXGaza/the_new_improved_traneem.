import React from 'react';
import { Track } from '../types';

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

const Player: React.FC<PlayerProps> = ({ track, isPlaying, currentTime, onPlayPause, onSeek }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={track.coverUrl} className="w-12 h-12 rounded shadow" />
          <div className="font-bold">{track.name}</div>
        </div>
        <button onClick={onPlayPause} className="p-3 bg-blue-500 text-white rounded-full">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <input 
          type="range" 
          value={currentTime} 
          max={track.duration || 100} 
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 mx-4"
        />
      </div>
    </div>
  );
};

export default Player;
