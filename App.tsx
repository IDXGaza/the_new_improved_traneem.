import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Track, Timestamp, PlayerState } from './types';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import TimestampManager from './components/TimestampManager';

const UNIFORM_PLACEHOLDER = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&h=600&auto=format&fit=crop";
const DB_NAME = 'TraneemDB';
const STORE_NAME = 'tracks';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveTrackToDB = async (track: any) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(track);
};

const getAllTracksFromDB = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false, currentTime: 0, volume: 1, playbackRate: 1, isLoading: false, isLooping: false
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  useEffect(() => {
    getAllTracksFromDB().then(saved => {
      const formatted = saved.map(t => ({
        ...t,
        url: t.fileBlob ? URL.createObjectURL(t.fileBlob) : (t.audioUrl || ""),
        coverUrl: t.coverBlob ? URL.createObjectURL(t.coverBlob) : (t.coverUrl || UNIFORM_PLACEHOLDER)
      }));
      setTracks(formatted);
      if (formatted.length > 0) setCurrentTrackIndex(0);
    });
  }, []);

  const handleCreateBackup = async () => {
    try {
      setIsProcessingBackup(true);
      const zip = new JSZip();
      const allTracks = await getAllTracksFromDB();
      const metadata = allTracks.map(t => {
        const meta = { ...t };
        if (t.fileBlob) zip.file(`audio/${t.id}`, t.fileBlob);
        if (t.coverBlob) zip.file(`covers/${t.id}`, t.coverBlob);
        delete meta.fileBlob; delete meta.coverBlob;
        return meta;
      });
      zip.file('metadata.json', JSON.stringify(metadata));
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = `traneem_backup_${Date.now()}.zip`;

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(content);
        });
        await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
        alert('تم حفظ النسخة في Documents');
        return;
      } catch (e) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
      }
    } catch (error) { alert("خطأ في النسخ الاحتياطي"); }
    finally { setIsProcessingBackup(false); }
  };

  const addTrack = async (file: File) => {
    const newTrack: Track = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""),
      artist: "", url: URL.createObjectURL(file), coverUrl: UNIFORM_PLACEHOLDER,
      isFavorite: false, timestamps: [], duration: 0, playbackRate: 1, fileBlob: file
    };
    setTracks([...tracks, newTrack]);
    saveTrackToDB(newTrack);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar 
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        tracks={tracks} currentTrackIndex={currentTrackIndex}
        onSelectTrack={(i) => { setCurrentTrackIndex(i); setPlayerState({...playerState, isPlaying: true}); }}
        onAddTrack={addTrack} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen}
        handleCreateBackup={handleCreateBackup} isProcessingBackup={isProcessingBackup}
        fileInputRef={fileInputRef} onDeleteTrack={(id: string) => setTracks(tracks.filter(t => t.id !== id))}
        handleRestoreBackup={() => {}} 
      />
      <main className="pb-32 pt-4 px-4 max-w-4xl mx-auto">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 mb-4">☰</button>
        {currentTrack && (
          <div className="text-center">
            <img src={currentTrack.coverUrl} className="w-64 h-64 mx-auto rounded-3xl object-cover shadow-2xl mb-6" />
            <h2 className="text-3xl font-bold mb-2">{currentTrack.name}</h2>
            <TimestampManager 
              timestamps={currentTrack.timestamps} currentTime={playerState.currentTime}
              onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
              onAdd={() => {}} onRemove={(id: string) => {}}
            />
          </div>
        )}
      </main>
      {currentTrack && (
        <Player 
          track={currentTrack} playerState={playerState} 
          onPlayPause={() => {
            if (playerState.isPlaying) audioRef.current?.pause();
            else audioRef.current?.play();
            setPlayerState({...playerState, isPlaying: !playerState.isPlaying});
          }}
          onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
          onNext={() => {}} onPrevious={() => {}} onToggleLoop={() => {}}
          onRateChange={() => {}} onToggleFavorite={() => {}} audioRef={audioRef}
        />
      )}
      <audio 
        ref={audioRef} src={currentTrack?.url} 
        onTimeUpdate={() => setPlayerState(prev => ({...prev, currentTime: audioRef.current?.currentTime || 0}))} 
      />
    </div>
  );
};

export default App;
          
