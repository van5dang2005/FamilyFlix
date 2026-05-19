import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, X, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineService } from '../lib/offlineService';
import { useContentDetail } from '../hooks/useContent';
import { useLocalUrl } from '../hooks/useLocalUrl';

// ── Offline photo resolver ────────────────────────────────────────────────────
function OfflinePhotoGallery({ id }: { id: string }) {
  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    offlineService.getOfflineContentList().then(async (list) => {
      const item = list.find((i) => i.id === id);
      if (!item) { setLoading(false); return; }
      setAlbum(item);
      const urls: string[] = [];
      if (item.localAlbumPhotos && item.localAlbumPhotos.length > 0) {
        for (const path of item.localAlbumPhotos) {
          const url = await offlineService.getLocalUrl(path);
          urls.push(url);
        }
      } else if (item.localMediaPath) {
        const url = await offlineService.getLocalUrl(item.localMediaPath);
        if (url) urls.push(url);
      }
      setPhotos(urls);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setCurrentIndex(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (loading) return <GalleryLoader />;
  if (!album) return <GalleryError message="Offline content not found." onBack={() => navigate(-1)} />;

  return (
    <GalleryLayout
      title={album.title}
      category={album.category}
      photos={photos}
      isOffline={true}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      onBack={() => navigate(-1)}
    />
  );
}

// ── Online gallery using hook ─────────────────────────────────────────────────
function OnlinePhotoGallery({ id }: { id: string }) {
  const navigate = useNavigate();
  const { content, loading, error } = useContentDetail(id);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setCurrentIndex(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (loading) return <GalleryLoader />;

  if (error || !content) {
    return <GalleryError message={error ?? 'Album not found.'} onBack={() => navigate(-1)} />;
  }

  const photos = content.albumPhotos ?? [];

  return (
    <GalleryLayout
      title={content.title}
      category={content.category}
      photos={photos}
      isOffline={false}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      onBack={() => navigate(-1)}
    />
  );
}

// ── Shared layout ─────────────────────────────────────────────────────────────
interface GalleryLayoutProps {
  title: string;
  category: string;
  photos: string[];
  isOffline: boolean;
  currentIndex: number | null;
  setCurrentIndex: (i: number | null) => void;
  onBack: () => void;
}

function GalleryLayout({
  title, category, photos, isOffline,
  currentIndex, setCurrentIndex, onBack,
}: GalleryLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 pt-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="hover:text-zinc-400 p-2 -ml-2 transition-colors">
            <ArrowLeft size={32} />
          </button>
          <div>
            <h1 className="text-4xl font-bold">{title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-zinc-400">{category} • Photo Album</p>
              {isOffline && (
                <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-600/30 flex items-center gap-1">
                  <WifiOff size={10} /> Offline
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="py-24 text-center text-zinc-500">
            <p className="text-xl">No photos available.</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentIndex(index)}
              className="aspect-square rounded overflow-hidden cursor-pointer bg-zinc-900 focus:ring-2 focus:ring-red-600 outline-none"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setCurrentIndex(index)}
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {currentIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4"
          >
            <button
              onClick={() => setCurrentIndex(null)}
              className="absolute top-8 right-8 text-white hover:text-zinc-400 z-[110] p-2"
            >
              <X size={40} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : photos.length - 1);
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white hover:text-zinc-400 z-[110] p-2"
            >
              <ChevronLeft size={48} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(currentIndex < photos.length - 1 ? currentIndex + 1 : 0);
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white hover:text-zinc-400 z-[110] p-2"
            >
              <ChevronRight size={48} />
            </button>

            <motion.img
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={photos[currentIndex]}
              className="max-w-full max-h-full object-contain pointer-events-none"
              alt={`Photo ${currentIndex + 1}`}
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared utilities ──────────────────────────────────────────────────────────
function GalleryLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <svg className="animate-spin w-12 h-12 text-red-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );
}

function GalleryError({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
      <p className="text-lg text-zinc-400">{message}</p>
      <button onClick={onBack} className="text-red-500 underline">Go back</button>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function PhotoGallery() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isOfflineMode = new URLSearchParams(location.search).get('offline') === 'true';

  if (!id) {
    return <GalleryError message="No album ID provided." onBack={() => window.history.back()} />;
  }

  if (isOfflineMode) {
    return <OfflinePhotoGallery id={id} />;
  }

  return <OnlinePhotoGallery id={id} />;
}