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

const saveTrackToDB = async (track: Track) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(track);
};

const getAllTracksFromDB = async (): Promise<Track[]> => {
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
      const sorted = saved.sort((a, b) => (a.order || 0) - (b.order || 0));
      const formatted = sorted.map(t => ({
        ...t,
        url: t.fileBlob ? URL.createObjectURL(t.fileBlob) : t.url,
        coverUrl: t.coverBlob ? URL.createObjectURL(t.coverBlob) : t.coverUrl
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
        return meta;
      });
      zip.file('metadata.json', JSON.stringify(metadata));
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = `traneem_backup_${Date.now()}.zip`;

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(content);
      });
      await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
      alert('تم الحفظ بنجاح');
    } catch (e) { alert("فشل الحفظ، تأكد من تثبيت Capacitor Filesystem"); }
    finally { setIsProcessingBackup(false); }
  };

  const addTrack = async (file: File) => {
    const newTrack: Track = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""),
      artist: "فنان غير معروف",
      url: URL.createObjectURL(file),
      coverUrl: UNIFORM_PLACEHOLDER,
      isFavorite: false,
      timestamps: [],
      duration: 0,
      playbackRate: 1,
      order: tracks.length, // حل مشكلة الـ order
      fileBlob: file
    };
    const updatedTracks = [...tracks, newTrack];
    setTracks(updatedTracks);
    await saveTrackToDB(newTrack);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        tracks={tracks}
        onSelectTrack={(i: number) => setCurrentTrackIndex(i)}
        onAddTrack={addTrack}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        handleCreateBackup={handleCreateBackup}
        isProcessingBackup={isProcessingBackup}
      />

      <main className="max-w-4xl mx-auto p-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-4 text-2xl">☰</button>
        {currentTrack && (
          <div className="text-center">
            <img src={currentTrack.coverUrl} className="w-64 h-64 mx-auto rounded-xl shadow-lg" />
            <h2 className="text-2xl font-bold mt-4">{currentTrack.name}</h2>
            <TimestampManager 
              timestamps={currentTrack.timestamps}
              currentTime={playerState.currentTime}
              onSeek={(t: number) => { if(audioRef.current) audioRef.current.currentTime = t; }}
            />
          </div>
        )}
      </main>

      {currentTrack && (
        <Player 
          track={currentTrack}
          onPlayPause={() => playerState.isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
          isPlaying={playerState.isPlaying}
          currentTime={playerState.currentTime}
          onSeek={(t: number) => { if(audioRef.current) audioRef.current.currentTime = t; }}
        />
      )}

      <audio 
        ref={audioRef}
        src={currentTrack?.url}
        onPlay={() => setPlayerState({...playerState, isPlaying: true})}
        onPause={() => setPlayerState({...playerState, isPlaying: false})}
        onTimeUpdate={() => setPlayerState({...playerState, currentTime: audioRef.current?.currentTime || 0})}
      />
    </div>
  );
};

export default App;
                     
