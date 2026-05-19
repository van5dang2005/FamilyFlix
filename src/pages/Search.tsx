import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon, ArrowLeft, Play,
  SlidersHorizontal, ChevronDown, ChevronUp,
  Clock, Calendar, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentList } from '../hooks/useContent';

export default function Search() {
  const navigate = useNavigate();

  // ── Fetch all content from API ──────────────────────────────────────────────
  const { content, loading, error } = useContentList();

  // ── Filter / sort state ─────────────────────────────────────────────────────
  const [searchTerm,       setSearchTerm]       = useState('');
  const [filterType,       setFilterType]       = useState<'all' | 'video' | 'album'>('all');
  const [sortBy,           setSortBy]           = useState<'newest' | 'oldest'>('newest');
  const [durationFilter,   setDurationFilter]   = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAdvanced,     setShowAdvanced]     = useState(false);

  // ── Derived unique categories ───────────────────────────────────────────────
  const categories = useMemo(
    () => Array.from(new Set(content.map(c => c.category))).sort(),
    [content],
  );

  // ── Derived results ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    const isFiltering =
      trimmed !== '' ||
      filterType !== 'all' ||
      selectedCategory !== 'all' ||
      durationFilter !== 'all';

    if (!isFiltering) return [];

    const filtered = content.filter(item => {
      // text search
      if (
        trimmed &&
        !item.title.toLowerCase().includes(trimmed) &&
        !item.category.toLowerCase().includes(trimmed) &&
        !(item.description ?? '').toLowerCase().includes(trimmed)
      ) return false;

      // type
      if (filterType !== 'all' && item.type !== filterType) return false;

      // category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // duration (video only)
      if (durationFilter !== 'all') {
        const dur = item.duration ?? 0;
        if (durationFilter === 'short'  && dur >= 300)          return false;
        if (durationFilter === 'medium' && (dur < 300 || dur > 1200)) return false;
        if (durationFilter === 'long'   && dur <= 1200)         return false;
      }

      return true;
    });

    return filtered.slice().sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortBy === 'newest' ? diff : -diff;
    });
  }, [content, searchTerm, filterType, selectedCategory, durationFilter, sortBy]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Search bar + back ── */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="hover:text-zinc-400 p-2 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="relative flex-grow">
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                size={20}
              />
              <input
                autoFocus
                type="text"
                placeholder="Movies, categories, or family events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 text-white pl-12 pr-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {([
                { id: 'all',   label: 'All Content' },
                { id: 'video', label: 'Videos' },
                { id: 'album', label: 'Albums' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilterType(t.id)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                    filterType === t.id
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              <div className="h-8 w-px bg-zinc-800 mx-2 flex-shrink-0" />

              <button
                onClick={() => setShowAdvanced(v => !v)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all border ${
                  showAdvanced
                    ? 'bg-white text-black border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                <SlidersHorizontal size={16} />
                Filters
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* ── Advanced filters panel ── */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Category */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Category
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            selectedCategory === 'all'
                              ? 'bg-zinc-100 text-black'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          All
                        </button>
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedCategory === cat
                                ? 'bg-zinc-100 text-black'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Clock size={14} /> Duration
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { id: 'all',    l: 'Any' },
                          { id: 'short',  l: '< 5m' },
                          { id: 'medium', l: '5–20m' },
                          { id: 'long',   l: '> 20m' },
                        ] as const).map(d => (
                          <button
                            key={d.id}
                            onClick={() => setDurationFilter(d.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              durationFilter === d.id
                                ? 'bg-zinc-100 text-black'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {d.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Calendar size={14} /> Sort By
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'newest', l: 'Newest' },
                          { id: 'oldest', l: 'Oldest' },
                        ] as const).map(s => (
                          <button
                            key={s.id}
                            onClick={() => setSortBy(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              sortBy === s.id
                                ? 'bg-zinc-100 text-black'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {s.l}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-zinc-500 gap-3">
            <Loader2 size={24} className="animate-spin" />
            <span>Đang tải nội dung...</span>
          </div>
        )}

        {/* ── API error ── */}
        {!loading && error && (
          <div className="text-center py-16 text-red-400">
            <p>Lỗi tải dữ liệu: {error}</p>
          </div>
        )}

        {/* ── Results grid ── */}
        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/content/${item.id}`)}
                className="relative aspect-video rounded overflow-hidden cursor-pointer group bg-zinc-900"
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play fill="white" size={32} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">
                    {item.category} · {item.type}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Empty state (searched but no results) ── */}
        {!loading && !error && searchTerm.trim() !== '' && results.length === 0 && (
          <div className="text-center py-24 text-zinc-500">
            <p className="text-xl">No results found for "{searchTerm}"</p>
            <p className="text-sm mt-2">
              Try searching for a category name or event title.
            </p>
          </div>
        )}

        {/* ── Idle state (nothing typed yet) ── */}
        {!loading && !error && searchTerm.trim() === '' && filterType === 'all' && selectedCategory === 'all' && durationFilter === 'all' && (
          <div className="text-center py-24 text-zinc-600">
            <SearchIcon size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Start typing to search your family memories.</p>
          </div>
        )}

      </div>
    </div>
  );
}