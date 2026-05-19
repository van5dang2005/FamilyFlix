import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Plus, Check, ThumbsUp, ArrowLeft, Clock,
  Download, Share2, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { useContentDetail } from '../hooks/useContent';
import { offlineService } from '../lib/offlineService';

export default function ContentDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();

  const {
    content, loading, error,
    toggling,
    toggleList, toggleLike, download,
  } = useContentDetail(id);

  // Local UI state for offline download progress
  const [downloading,   setDownloading]   = useState(false);
  const [downloadDone,  setDownloadDone]  = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (downloading || downloadDone || content?.isDownloaded) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      // 1. Mark downloaded on server & get URLs
      const res = await download();
      if (!res) throw new Error('Không thể lấy đường dẫn tải về.');

      // 2. Save to device via offlineService
      await offlineService.downloadContent({
        id:           content!.id,
        title:        content!.title,
        description:  content!.description ?? '',
        category:     content!.category,
        type:         content!.type,
        thumbnailUrl: content!.thumbnailUrl,
        mediaUrl:     res.mediaUrl ?? '',
        albumPhotos:  res.albumPhotos,
      });

      setDownloadDone(true);
    } catch (err: any) {
      setDownloadError(err.message ?? 'Tải xuống thất bại.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: content?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // ── Loading / Error states ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white px-6">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-lg font-medium">{error ?? 'Không tìm thấy nội dung.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-400 underline text-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const isAlreadyDownloaded = content.isDownloaded || downloadDone;
  const playPath = content.type === 'video'
    ? `/watch/${content.id}`
    : `/album/${content.id}`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white pb-24">

      {/* ── Banner ── */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        <img
          src={content.thumbnailUrl}
          alt={content.title}
          className="w-full h-full object-cover brightness-60"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 left-6 p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all z-20"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Type badge */}
        <div className="absolute top-8 right-6 bg-zinc-900/70 backdrop-blur-sm border border-zinc-700 text-xs font-bold uppercase px-3 py-1 rounded-full">
          {content.type === 'video' ? '▶ Video' : '📷 Album'}
        </div>
      </div>

      {/* ── Content Info ── */}
      <div className="px-6 md:px-16 -mt-24 relative z-10 space-y-6 max-w-5xl">

        {/* Title + meta */}
        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black leading-none tracking-tight"
          >
            {content.title}
          </motion.h1>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-400">
            <span className="text-green-500 font-bold">Mới nhất</span>
            <span className="text-zinc-600">•</span>
            <span>{new Date(content.createdAt).toLocaleDateString('vi-VN')}</span>
            <span className="text-zinc-600">•</span>
            <span className="border border-zinc-700 px-1.5 py-0.5 rounded text-xs">HD</span>
            {content.duration ? (
              <>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {Math.floor(content.duration / 60)}m {content.duration % 60}s
                </span>
              </>
            ) : null}
            {content.isKids && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  Kids
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Play */}
          <button
            onClick={() => navigate(playPath)}
            className="flex-1 bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
          >
            <Play fill="black" size={20} /> Phát
          </button>

          {/* My List */}
          <button
            onClick={toggleList}
            disabled={toggling === 'list'}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
              content.isInList
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            } disabled:opacity-60`}
          >
            {toggling === 'list' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : content.isInList ? (
              <Check size={18} className="text-green-400" />
            ) : (
              <Plus size={18} />
            )}
            {content.isInList ? 'Đã thêm' : 'My List'}
          </button>

          {/* Like */}
          <button
            onClick={toggleLike}
            disabled={toggling === 'like'}
            className={`p-3 rounded-xl font-bold flex items-center justify-center transition-all border ${
              content.isLiked
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            } disabled:opacity-60`}
          >
            {toggling === 'like' ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ThumbsUp size={20} fill={content.isLiked ? 'white' : 'none'} />
            )}
          </button>

          {/* Download */}
          {!isAlreadyDownloaded ? (
            <button
              onClick={handleDownload}
              disabled={downloading || toggling === 'download'}
              className="p-3 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-700 transition-colors disabled:opacity-60"
              title="Tải về để xem offline"
            >
              {downloading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
            </button>
          ) : (
            <div
              className="p-3 bg-green-600/10 border border-green-600/30 text-green-400 rounded-xl flex items-center justify-center"
              title="Đã tải về"
            >
              <CheckCircle2 size={20} />
            </div>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-3 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl font-bold flex items-center justify-center hover:bg-zinc-700 transition-colors"
            title="Chia sẻ"
          >
            <Share2 size={20} />
          </button>
        </motion.div>

        {/* Download error */}
        <AnimatePresence>
          {downloadError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-red-400 bg-red-600/10 border border-red-600/20 px-4 py-3 rounded-xl"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              {downloadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base text-zinc-300 leading-relaxed max-w-3xl"
        >
          {content.description}
        </motion.p>

        {/* ── Metadata grid ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/60"
        >
          <div className="space-y-3">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
              Chi tiết
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-zinc-500 w-28 flex-shrink-0">Danh mục</dt>
                <dd>{content.category}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-zinc-500 w-28 flex-shrink-0">Loại</dt>
                <dd className="capitalize">{content.type === 'video' ? 'Video' : 'Album ảnh'}</dd>
              </div>
              {content.albumPhotos?.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-zinc-500 w-28 flex-shrink-0">Số ảnh</dt>
                  <dd>{content.albumPhotos.length} ảnh</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-zinc-500 w-28 flex-shrink-0">Phù hợp trẻ em</dt>
                <dd className={content.isKids ? 'text-green-400' : 'text-zinc-300'}>
                  {content.isKids ? 'Có' : 'Không'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
              Trạng thái
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2 items-center">
                <dt className="text-zinc-500 w-28 flex-shrink-0">My List</dt>
                <dd className={content.isInList ? 'text-green-400' : 'text-zinc-500'}>
                  {content.isInList ? '✓ Đã thêm' : '—'}
                </dd>
              </div>
              <div className="flex gap-2 items-center">
                <dt className="text-zinc-500 w-28 flex-shrink-0">Đã thích</dt>
                <dd className={content.isLiked ? 'text-red-400' : 'text-zinc-500'}>
                  {content.isLiked ? '♥ Đã thích' : '—'}
                </dd>
              </div>
              <div className="flex gap-2 items-center">
                <dt className="text-zinc-500 w-28 flex-shrink-0">Offline</dt>
                <dd className={isAlreadyDownloaded ? 'text-blue-400' : 'text-zinc-500'}>
                  {isAlreadyDownloaded ? '↓ Đã tải' : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </motion.div>

        {/* ── Album preview strip ── */}
        {content.type === 'album' && content.albumPhotos?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 pt-4"
          >
            <h3 className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
              Xem trước ({content.albumPhotos.length} ảnh)
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {content.albumPhotos.slice(0, 8).map((photo, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/album/${content.id}`)}
                  className="flex-none w-28 aspect-square rounded-lg overflow-hidden bg-zinc-900 hover:scale-105 transition-transform"
                >
                  <img
                    src={photo}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
              {content.albumPhotos.length > 8 && (
                <button
                  onClick={() => navigate(`/album/${content.id}`)}
                  className="flex-none w-28 aspect-square rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400 hover:bg-zinc-700 transition-colors"
                >
                  +{content.albumPhotos.length - 8}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}