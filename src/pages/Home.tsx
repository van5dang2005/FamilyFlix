import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Info, Search, User as UserIcon, LogOut,
  WifiOff, Plus, Check, Sparkles, Shield,
  Download, Loader2,
} from 'lucide-react';
import { Network } from '@capacitor/network';
import { useAuth } from '../hooks/useAuth';
import { useContentList, useMyList } from '../hooks/useContent';
import { offlineService, OfflineContent } from '../lib/offlineService';
import { getFamilyRecommendation } from '../services/geminiService';
import OfflineCard from '../components/OfflineCard';
import { contentService } from '../services/contentService';

export default function Home() {
  const navigate = useNavigate();
  const { logoutUser, selectedProfile, isAdmin } = useAuth();

  // ── Network & UI state ────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ── Offline content ───────────────────────────────────────────────────────
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);

  // ── Download state ────────────────────────────────────────────────────────
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ── Gemini recommendation ─────────────────────────────────────────────────
  const [recommendation, setRecommendation] = useState<{
    contentTitle: string;
    message: string;
  } | null>(null);

  // ── My-list toggle optimistic map ─────────────────────────────────────────
  const [listOverrides, setListOverrides] = useState<Record<string, boolean>>({});

  // ── API data ──────────────────────────────────────────────────────────────
  const { content, loading: contentLoading } = useContentList(
    selectedProfile?.isKids ? { is_kids: true } : undefined
  );
  const { myList, refresh: refreshMyList } = useMyList();

  // ── Derived ───────────────────────────────────────────────────────────────
  const categories = Array.from(new Set(content.map(c => c.category)));
  const featured = content[0] ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Network status
  useEffect(() => {
    Network.getStatus().then(s => setIsOnline(s.connected));
    const listener = Network.addListener('networkStatusChange', s =>
      setIsOnline(s.connected)
    );
    return () => { listener.then(l => l.remove()); };
  }, []);

  // Scroll shadow on navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Offline list
  useEffect(() => {
    offlineService.getOfflineContentList().then(setOfflineContent);
  }, []);

  // Gemini recommendation (only online, only when content loaded)
  useEffect(() => {
    if (!isOnline || content.length === 0) return;
    const profileName = selectedProfile?.name ?? 'Family';
    getFamilyRecommendation(content, profileName)
      .then(r => { if (r) setRecommendation(r); })
      .catch(() => {/* silently ignore */});
  }, [isOnline, content, selectedProfile]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleToggleList = async (id: string) => {
    // optimistic
    const currentlyIn = myList.some(i => i.id === id) || listOverrides[id] === true;
    setListOverrides(prev => ({ ...prev, [id]: !currentlyIn }));
    try {
      await contentService.toggleList(id);
      await refreshMyList();
    } catch {
      // revert
      setListOverrides(prev => ({ ...prev, [id]: currentlyIn }));
    }
  };

  const isInList = (id: string) => {
    if (id in listOverrides) return listOverrides[id];
    return myList.some(i => i.id === id);
  };

  const handleDownload = async (item: typeof content[0]) => {
    if (downloadingId) return;
    setDownloadingId(item.id);
    try {
      const res = await contentService.download(item.id);
      await offlineService.downloadContent({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        type: item.type,
        thumbnailUrl: item.thumbnailUrl,
        mediaUrl: res.mediaUrl ?? '',
        albumPhotos: res.albumPhotos,
      });
      setOfflineContent(await offlineService.getOfflineContentList());
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemoveOffline = async (id: string) => {
    await offlineService.removeContent(id);
    setOfflineContent(await offlineService.getOfflineContentList());
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 px-6 py-4 flex items-center justify-between ${scrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-red-600 tracking-tighter">FAMILYFLIX</h1>

          {!isOnline && (
            <div className="flex items-center gap-2 bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-600/30">
              <WifiOff size={14} /> Offline Mode
            </div>
          )}

          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link to="/home" className="hover:text-zinc-300">Home</Link>
            <Link to="/search" className="hover:text-zinc-300">Search</Link>
            {isAdmin && (
              <Link to="/admin" className="hover:text-zinc-300 flex items-center gap-1 text-blue-400">
                <Shield size={14} /> Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Search size={20} className="cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => navigate('/search')} />

          <div className="relative">
            {selectedProfile?.avatar ? (
              <img
                src={selectedProfile.avatar}
                alt="Profile"
                className="w-8 h-8 rounded cursor-pointer border-2 border-transparent hover:border-white transition-all"
                onClick={() => setShowProfileMenu(v => !v)}
              />
            ) : (
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center"
              >
                <UserIcon size={16} />
              </button>
            )}

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded shadow-xl p-2"
                >
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/profiles'); }}
                    className="flex w-full items-center gap-3 text-sm hover:bg-zinc-800 p-2 rounded"
                  >
                    <UserIcon size={16} /> Switch Profile
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-3 text-sm hover:bg-zinc-800 p-2 rounded"
                  >
                    <Info size={16} /> Settings
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 text-sm hover:bg-red-600/10 p-2 rounded text-red-500"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      {featured && isOnline && !contentLoading && (
        <div className="relative h-[80vh] w-full">
          <img
            src={featured.thumbnailUrl}
            alt={featured.title}
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-24 left-12 max-w-xl space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold"
            >
              {featured.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-300 line-clamp-2"
            >
              {featured.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => navigate(featured.type === 'video' ? `/watch/${featured.id}` : `/album/${featured.id}`)}
                className="bg-white text-black px-8 py-2 rounded font-bold flex items-center gap-2 hover:bg-zinc-200 transition"
              >
                <Play fill="black" size={24} /> Play
              </button>
              <button
                onClick={() => navigate(`/content/${featured.id}`)}
                className="bg-zinc-500/50 text-white px-8 py-2 rounded font-bold flex items-center gap-2 hover:bg-zinc-500/70 transition"
              >
                <Info size={24} /> More Info
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── Content rows ── */}
      <div className={`relative ${isOnline && !contentLoading ? '-mt-12' : 'pt-24'} pb-24 space-y-8 px-6 md:px-12`}>

        {/* Loading skeleton */}
        {contentLoading && (
          <div className="space-y-6 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex-none w-64 aspect-video bg-zinc-800 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gemini recommendation */}
        {isOnline && recommendation && !contentLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-6"
          >
            <div className="bg-red-600/20 p-4 rounded-full text-red-500 flex-shrink-0">
              <Sparkles size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Gemini Pick</h4>
              <p className="text-xl font-medium leading-snug">"{recommendation.message}"</p>
            </div>
            <button
              onClick={() => {
                const match = content.find(c =>
                  c.title.toLowerCase() === recommendation.contentTitle.toLowerCase()
                );
                if (match) navigate(`/content/${match.id}`);
              }}
              className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm flex-shrink-0"
            >
              Watch now
            </button>
          </motion.div>
        )}

        {/* My List */}
        {isOnline && myList.length > 0 && !contentLoading && (
          <section className="space-y-2">
            <h3 className="text-xl font-semibold">My List</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {myList.map(item => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate(`/content/${item.id}`)}
                  className="flex-none w-48 aspect-video relative rounded overflow-hidden cursor-pointer"
                >
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Category rows (online) */}
        {isOnline && !contentLoading && categories.map(category => (
          <div key={category} className="space-y-2">
            <h3 className="text-xl font-semibold">{category}</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
              {content.filter(c => c.category === category).map(item => {
                const inList = isInList(item.id);
                const isDownloaded = offlineContent.some(o => o.id === item.id);
                const isDownloading = downloadingId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    className="flex-none w-64 aspect-video relative rounded overflow-hidden cursor-pointer group"
                    onClick={() => navigate(`/content/${item.id}`)}
                  >
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(item.type === 'video' ? `/watch/${item.id}` : `/album/${item.id}`); }}
                        className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                      >
                        <Play fill="black" size={18} />
                      </button>

                      <button
                        onClick={e => { e.stopPropagation(); handleToggleList(item.id); }}
                        className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors"
                        title={inList ? 'Remove from list' : 'Add to list'}
                      >
                        {inList
                          ? <Check size={18} className="text-green-400" />
                          : <Plus size={18} />
                        }
                      </button>

                      <button
                        onClick={e => { e.stopPropagation(); handleDownload(item); }}
                        disabled={isDownloading || isDownloaded}
                        className="p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        title={isDownloaded ? 'Downloaded' : 'Download for offline'}
                      >
                        {isDownloading
                          ? <Loader2 size={18} className="animate-spin" />
                          : <Download size={18} className={isDownloaded ? 'text-blue-400' : ''} />
                        }
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{item.category}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Offline mode */}
        {!isOnline && (
          <div className="space-y-6">
            {offlineContent.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <WifiOff size={64} className="mx-auto text-zinc-700" />
                <h2 className="text-2xl font-bold">You're Offline</h2>
                <p className="text-zinc-500">No downloaded content available.</p>
              </div>
            ) : (
              <section className="space-y-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <WifiOff size={18} className="text-zinc-500" /> Downloaded
                </h3>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
                  {offlineContent.map(item => (
                    <OfflineCard
                      key={item.id}
                      item={item}
                      onPlay={i => navigate(i.type === 'video' ? `/watch/${i.id}?offline=true` : `/album/${i.id}?offline=true`)}
                      onRemove={handleRemoveOffline}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Offline downloads strip (when online) */}
        {isOnline && offlineContent.length > 0 && !contentLoading && (
          <section className="space-y-2">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Download size={18} className="text-blue-400" /> Downloaded
            </h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
              {offlineContent.map(item => (
                <OfflineCard
                  key={item.id}
                  item={item}
                  onPlay={i => navigate(i.type === 'video' ? `/watch/${i.id}` : `/album/${i.id}`)}
                  onRemove={handleRemoveOffline}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}