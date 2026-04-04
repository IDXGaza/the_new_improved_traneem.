import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
// @ts-ignore
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Track, PlayerState } from './types';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import TimestampManager from './components/TimestampManager';

const UNIFORM_PLACEHOLDER = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop";

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false, currentTime: 0, volume: 1, playbackRate: 1, isLoading: false, isLooping: false
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const handleCreateBackup = async () => {
    try {
      setIsProcessingBackup(true);
      const zip = new JSZip();
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = `backup_${Date.now()}.zip`;
      
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(content);
        });
        await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
        alert('تم حفظ النسخة الاحتياطية');
      } catch (e) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
      }
    } catch (err) {
      alert('خطأ في إنشاء النسخة');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const addTrack = async (file: File) => {
    const newTrack: Track = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown",
      url: URL.createObjectURL(file),
      coverUrl: UNIFORM_PLACEHOLDER,
      isFavorite: false,
      timestamps: [],
      duration: 0,
      playbackRate: 1,
      order: tracks.length,
      fileBlob: file
    };
    setTracks([...tracks, newTrack]);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar 
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        tracks={tracks} onSelectTrack={(i) => setCurrentTrackIndex(i)}
        onAddTrack={addTrack} isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        handleCreateBackup={handleCreateBackup} isProcessingBackup={isProcessingBackup}
      />
      
      <main className="p-4 max-w-4xl mx-auto">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-2xl">☰</button>
        {currentTrack && (
          <div className="text-center mt-10">
            <img src={currentTrack.coverUrl} className="w-64 h-64 mx-auto rounded-2xl shadow-xl mb-6" />
            <h2 className="text-3xl font-bold">{currentTrack.name}</h2>
            <TimestampManager 
              timestamps={currentTrack.timestamps} 
              currentTime={playerState.currentTime}
              onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
            />
          </div>
        )}
      </main>

      {currentTrack && (
        <Player 
          track={currentTrack} isPlaying={playerState.isPlaying}
          currentTime={playerState.currentTime}
          onPlayPause={() => playerState.isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
          onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
        />
      )}

      <audio 
        ref={audioRef} src={currentTrack?.url}
        onTimeUpdate={() => setPlayerState(prev => ({...prev, currentTime: audioRef.current?.currentTime || 0}))}
        onPlay={() => setPlayerState(prev => ({...prev, isPlaying: true}))}
        onPause={() => setPlayerState(prev => ({...prev, isPlaying: false}))}
      />
    </div>
  );
};

export default App; // تأكد أن هذا السطر موجود في النهاية
    
