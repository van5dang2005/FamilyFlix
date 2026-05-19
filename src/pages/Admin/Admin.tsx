import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Trash2, Video, Image as ImageIcon, Users,
  Shield, X, Activity, ArrowLeft, RefreshCw,
  CheckCircle2, AlertCircle, HardDrive, Link,
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useAdmin, useAdminContent, useAdminUsers } from '../../hooks/useAdmin';
import { UploadContentPayload } from '../../services/adminService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Home Movies', 'Travel', 'Kids', 'Events',
  'Documentary', 'Action', 'Holiday',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Admin() {
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  // Hooks
  const { stats, loading: statsLoading, refresh: refreshStats } = useAdmin();
  const {
    content, loading: contentLoading,
    uploading, progress, uploadStep, error: contentError,
    deleteConfirm, upload,
    confirmDelete, cancelDelete, executeDelete,
    refresh: refreshContent,
  } = useAdminContent();
  const {
    users, loading: usersLoading, error: usersError,
    updateRole, refresh: refreshUsers,
  } = useAdminUsers();

  // Tabs
  const [activeTab, setActiveTab] = useState<'content' | 'users'>('content');

  // Upload form state
  const [type,        setType]        = useState<'video' | 'album'>('video');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState(CATEGORIES[0]);
  const [isKids,      setIsKids]      = useState(false);
  const [thumbFile,   setThumbFile]   = useState<File | null>(null);
  const [mediaUrl,    setMediaUrl]    = useState('');   // <-- URL thay vì file
  const [albumFiles,  setAlbumFiles]  = useState<File[]>([]);
  const [success,     setSuccess]     = useState(false);

  // Guard
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Shield size={64} className="mx-auto text-red-600" />
          <h2 className="text-2xl font-bold">Không có quyền truy cập</h2>
          <button
            onClick={() => navigate('/home')}
            className="text-zinc-400 underline text-sm"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  // ── Form submit ─────────────────────────────────────────────────────────────

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbFile) return;
    if (type === 'video' && !mediaUrl.trim()) return;
    if (type === 'album' && albumFiles.length === 0) return;

    const payload: UploadContentPayload = {
      title, description, category, type, is_kids: isKids,
      thumbnail: thumbFile,
      ...(type === 'video'
        ? { media_url: mediaUrl.trim() }
        : { album_photos: albumFiles }),
    };

    const ok = await upload(payload);
    if (ok) {
      setTitle('');
      setDescription('');
      setIsKids(false);
      setThumbFile(null);
      setMediaUrl('');
      setAlbumFiles([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      refreshStats();
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black italic text-red-600 uppercase tracking-tight">
            Admin Panel
          </h1>
        </div>
        <button
          onClick={() => { refreshStats(); refreshContent(); refreshUsers(); }}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng nội dung', value: statsLoading ? '…' : stats?.total_content ?? '—' },
            { label: 'Người dùng',    value: statsLoading ? '…' : stats?.total_users    ?? '—' },
            { label: 'Dung lượng',    value: statsLoading ? '…' : stats?.storage_used   ?? '—' },
            { label: 'Trạng thái',    value: statsLoading ? '…' : stats?.status         ?? '—' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                {s.label}
              </p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-6 border-b border-zinc-800">
          {(['content', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold uppercase tracking-widest relative transition-colors ${
                activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'content' ? 'Nội dung' : 'Thành viên'}
              {activeTab === tab && (
                <motion.div
                  layoutId="admin-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                />
              )}
            </button>
          ))}
        </div>

        {/* ══════════════ CONTENT TAB ══════════════ */}
        {activeTab === 'content' && (
          <div className="grid lg:grid-cols-2 gap-10">

            {/* ── Upload form ── */}
            <section className="space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Upload size={18} className="text-red-600" /> Đăng nội dung mới
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-3">
                  {(['video', 'album'] as const).map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setType(t)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-bold transition-all ${
                        type === t
                          ? 'border-red-600 bg-red-600/10 text-red-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {t === 'video' ? <Video size={22} /> : <ImageIcon size={22} />}
                      {t === 'video' ? 'Video' : 'Album ảnh'}
                    </button>
                  ))}
                </div>

                {/* Title */}
                <input
                  required
                  type="text"
                  placeholder="Tiêu đề *"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-600 transition-colors placeholder:text-zinc-600"
                />

                {/* Description */}
                <textarea
                  placeholder="Mô tả (tuỳ chọn)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-red-600 transition-colors placeholder:text-zinc-600"
                />

                {/* Category */}
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-600 transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Kids toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsKids(v => !v)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${isKids ? 'bg-red-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isKids ? 'left-5' : 'left-1'}`} />
                  </div>
                  <span className="text-sm text-zinc-300">Nội dung dành cho trẻ em</span>
                </label>

                {/* Thumbnail */}
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    Ảnh bìa (thumbnail) *
                  </label>
                  <input
                    required type="file" accept="image/*"
                    onChange={e => setThumbFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                  />
                  {thumbFile && (
                    <p className="text-[10px] text-zinc-500 truncate">{thumbFile.name}</p>
                  )}
                </div>

                {/* Media URL / Album files */}
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    {type === 'video' ? (
                      <><Link size={12} /> URL Video *</>
                    ) : (
                      <><ImageIcon size={12} /> Ảnh album *</>
                    )}
                  </label>

                  {type === 'video' ? (
                    <div className="relative">
                      <Link
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                      />
                      <input
                        required
                        type="url"
                        placeholder="https://example.com/video.mp4"
                        value={mediaUrl}
                        onChange={e => setMediaUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white pl-9 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-600 transition-colors placeholder:text-zinc-600 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <input
                        required type="file" multiple accept="image/*"
                        onChange={e => setAlbumFiles(Array.from(e.target.files ?? []))}
                        className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                      />
                      {albumFiles.length > 0 && (
                        <p className="text-[10px] text-zinc-500">{albumFiles.length} ảnh đã chọn</p>
                      )}
                    </>
                  )}
                </div>

                {/* Error */}
                {contentError && (
                  <div className="flex items-start gap-2 bg-red-600/10 border border-red-600/30 text-red-400 text-sm p-3 rounded-xl">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {contentError}
                  </div>
                )}

                {/* Success */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 bg-green-600/10 border border-green-600/30 text-green-400 text-sm p-3 rounded-xl"
                    >
                      <CheckCircle2 size={16} /> Đăng nội dung thành công!
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress bar */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-red-600"
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'linear', duration: 0.3 }}
                      />
                    </div>
                    <p className="text-[10px] text-center text-zinc-500 uppercase tracking-widest">
                      {uploadStep} — {progress}%
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Đang xử lý...
                    </>
                  ) : (
                    <><Upload size={16} /> Đăng kỷ niệm</>
                  )}
                </button>
              </form>
            </section>

            {/* ── Content list ── */}
            <section className="space-y-4">
              <h2 className="font-bold text-lg">
                Danh sách ({contentLoading ? '…' : content.length})
              </h2>

              {contentLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : content.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                  <HardDrive size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có nội dung nào.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {content.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 group"
                      >
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-24 aspect-video object-cover rounded-lg bg-zinc-800 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.title}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-tight mt-0.5">
                            {item.category} • {item.type}
                            {item.isKids && ' • Kids'}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-1">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                          {item.mediaUrl && (
                            <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                              {item.mediaUrl}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => confirmDelete(item.id)}
                          className="self-center p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ══════════════ USERS TAB ══════════════ */}
        {activeTab === 'users' && (
          <section className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users size={18} className="text-red-600" /> Thành viên ({usersLoading ? '…' : users.length})
            </h2>

            {usersError && (
              <div className="text-sm text-red-400 bg-red-600/10 border border-red-600/20 px-4 py-3 rounded-xl">
                {usersError}
              </div>
            )}

            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-800/60 text-zinc-500 text-[10px] uppercase tracking-widest">
                      <th className="text-left px-5 py-3">Thành viên</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Email</th>
                      <th className="text-left px-5 py-3">Vai trò</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Chế độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0"
                            />
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-400 hidden md:table-cell">{u.email}</td>
                        <td className="px-5 py-4">
                          <select
                            value={u.role}
                            onChange={e => updateRole(u.id, e.target.value as 'admin' | 'member')}
                            className="bg-zinc-800 border border-zinc-700 text-xs font-bold px-2 py-1.5 rounded-lg focus:outline-none focus:border-red-600"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-zinc-400 text-xs hidden md:table-cell">
                          {u.isKids ? (
                            <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">Trẻ em</span>
                          ) : (
                            <span className="text-zinc-500">Người lớn</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Trash2 size={20} className="text-red-500" />
                <h3 className="text-lg font-bold">Xóa nội dung?</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-6">
                Tệp vật lý trên máy chủ và bản ghi cơ sở dữ liệu sẽ bị xóa vĩnh viễn.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={executeDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Xóa
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 border border-zinc-700 hover:bg-zinc-800 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}