import React, { useState, useRef, useEffect } from 'react';
import { Track, Timestamp, PlayerState } from './types';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import TimestampManager from './components/TimestampManager';
import JSZip from 'jszip';
import { Filesystem, Directory } from '@capacitor/filesystem';

const UNIFORM_PLACEHOLDER = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&h=600&auto=format&fit=crop";

const DB_NAME = 'TraneemDB';
const STORE_NAME = 'tracks';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
        return reject(new Error("IndexedDB is not supported in this browser."));
      }
      const timeoutId = setTimeout(() => {
        reject(new Error("IndexedDB initialization timed out."));
      }, 3000);
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        clearTimeout(timeoutId);
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timeoutId);
        reject(request.error || new Error("Unknown IndexedDB error"));
      };
    } catch (error) {
      reject(error);
    }
  });
};

const saveTrackToDB = async (track: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).put(track);
    });
  } catch (error) {
    console.error("IndexedDB save error:", error);
    throw error;
  }
};

const deleteTrackFromDB = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_NAME).delete(id);
    });
  } catch (error) {
    console.error("IndexedDB delete error:", error);
    throw error;
  }
};

const getAllTracksFromDB = async (): Promise<any[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("IndexedDB get all error:", error);
    return [];
  }const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false, currentTime: 0, volume: 1, playbackRate: 1, isLoading: false, isLooping: false
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const handleCreateBackup = async () => {
    try {
      setIsProcessingBackup(true);
      const zip = new JSZip();
      const allTracks = await getAllTracksFromDB();
      const metadataList = [];
      
      for (const track of allTracks) {
        const trackMeta: any = { ...track };
        if (track.fileBlob) { zip.file(`audio/${track.id}`, track.fileBlob); delete trackMeta.fileBlob; }
        if (track.coverBlob) { zip.file(`covers/${track.id}`, track.coverBlob); delete trackMeta.coverBlob; }
        metadataList.push(trackMeta);
      }
      zip.file('metadata.json', JSON.stringify(metadataList));
      const content = await zip.generateAsync({ type: 'blob' });

      // التعديل المطلوب هنا
      const fileName = `traneem_backup_${Date.now()}.zip`;
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(content);
        });
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents,
        });
        alert('تم حفظ النسخة الاحتياطية في مجلد Documents');
        return;
      } catch (fsError) {
        console.log('Filesystem not available, trying fallback');
      }

      const file = new File([content], fileName, { type: 'application/zip' });
      const fallbackDownload = () => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'نسخة احتياطية - ترانيم' }); }
        catch (shareError: any) { if (shareError.name !== 'AbortError') fallbackDownload(); }
      } else { fallbackDownload(); }
    } catch (error) {
      console.error("Backup creation failed:", error);
      alert("حدث خطأ أثناء إنشاء النسخة الاحتياطية");
    } finally {
      setIsProcessingBackup(false);
      setIsDropdownOpen(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingBackup(true);
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const metadataFile = contents.file('metadata.json');
      if (!metadataFile) throw new Error("ملف النسخة الاحتياطية غير صالح");
      const metadataStr = await metadataFile.async('string');
      const metadataList = JSON.parse(metadataStr);
      for (const trackMeta of metadataList) {
        const audioFile = contents.file(`audio/${trackMeta.id}`);
        if (audioFile) trackMeta.fileBlob = await audioFile.async('blob');
        const coverFile = contents.file(`covers/${trackMeta.id}`);
        if (coverFile) trackMeta.coverBlob = await coverFile.async('blob');
        await saveTrackToDB(trackMeta);
      }
      window.location.reload();
    } catch (error) {
      alert("حدث خطأ أثناء استعادة النسخة الاحتياطية");
    } finally {
      setIsProcessingBackup(false);
    }
  };

  useEffect(() => {
    const loadLocalData = async () => {
      const savedTracks = await getAllTracksFromDB();
      const sortedTracks = savedTracks.sort((a, b) => (a.order || 0) - (b.order || 0));
      const tracksWithUrls = sortedTracks.map(t => ({
        ...t,
        url: t.fileBlob ? URL.createObjectURL(t.fileBlob) : (t.audioUrl || ""),
        coverUrl: t.coverBlob ? URL.createObjectURL(t.coverBlob) : (t.coverUrl || UNIFORM_PLACEHOLDER)
      }));
      setTracks(tracksWithUrls);
      if (tracksWithUrls.length > 0) setCurrentTrackIndex(0);
    };
    loadLocalData();
  }, []);

  const handleSelectTrack = (index: number) => { setCurrentTrackIndex(index); setPlayerState(prev => ({ ...prev, isPlaying: true })); };
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playerState.isPlaying) { audio.pause(); setPlayerState(prev => ({ ...prev, isPlaying: false })); }
    else { audio.play().catch(() => {}); setPlayerState(prev => ({ ...prev, isPlaying: true })); }
  };

  const addTrack = async (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTrack: Track = {
      id, name: file.name.replace(/\.[^/.]+$/, ""), artist: "",
      url: URL.createObjectURL(file), coverUrl: UNIFORM_PLACEHOLDER,
      isFavorite: false, timestamps: [], duration: 0, playbackRate: 1,
      order: tracks.length, fileBlob: file,
    };
    setTracks(prev => [...prev, newTrack]);
    saveTrackToDB(newTrack);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar 
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        tracks={tracks} currentTrackIndex={currentTrackIndex}
        onSelectTrack={handleSelectTrack} onAddTrack={addTrack}
        onDeleteTrack={(id) => { setTracks(prev => prev.filter(t => t.id !== id)); deleteTrackFromDB(id); }}
        isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen}
        handleCreateBackup={handleCreateBackup} handleRestoreBackup={handleRestoreBackup}
        isProcessingBackup={isProcessingBackup} fileInputRef={fileInputRef}
      />
      <main className="pb-32 pt-4 px-4 max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-2xl font-bold">ترانيم</h1>
          <div className="w-10"></div>
        </header>
        {currentTrack && (
          <div className="space-y-8 animate-fade-in text-center">
            <img src={currentTrack.coverUrl} className="w-64 h-64 mx-auto rounded-3xl object-cover shadow-2xl" />
            <h2 className="text-3xl font-black">{currentTrack.name}</h2>
            <TimestampManager timestamps={currentTrack.timestamps} currentTime={playerState.currentTime} onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }} onAdd={() => {}} onRemove={() => {}} />
          </div>
        )}
      </main>
      {currentTrack && (
        <Player 
          track={currentTrack} playerState={playerState} onPlayPause={handlePlayPause}
          onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
          onNext={() => {}} onPrevious={() => {}} onToggleLoop={() => {}}
          onRateChange={() => {}} onToggleFavorite={() => {}} audioRef={audioRef}
        />
      )}
      <audio ref={audioRef} src={currentTrack?.url} onTimeUpdate={() => setPlayerState(prev => ({...prev, currentTime: audioRef.current?.currentTime || 0}))} />
    </div>
  );
};

export default App;
        
};
                                
