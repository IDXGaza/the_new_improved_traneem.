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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <img src={track.coverUrl} className="w-12 h-12 rounded-lg object-cover shadow" alt="cover" />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold truncate dark:text-white">{track.name}</h4>
          <input 
            type="range" 
            min="0"
            max={track.duration || 100} 
            value={currentTime} 
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <button onClick={onPlayPause} className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
};

export default Player;
                                           
