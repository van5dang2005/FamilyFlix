import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trash2, Database, Shield, Info,
  ChevronRight, HardDrive, Loader2, AlertCircle,
} from 'lucide-react';
import { useSettings, useOfflineContent } from '../hooks/useSetting';
import { DownloadQuality } from '../services/settingService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const QUALITY_OPTIONS: { value: DownloadQuality; label: string; desc: string }[] = [
  { value: 'standard', label: 'Tiêu chuẩn (480p)',  desc: 'Tiết kiệm dung lượng' },
  { value: 'high',     label: 'Cao (1080p)',          desc: 'Chất lượng tốt' },
  { value: 'ultra',    label: 'Gốc (4K)',             desc: 'Chiếm nhiều dung lượng nhất' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateQuality,
  } = useSettings();

  const {
    items:   offlineItems,
    loading: offlineLoading,
    clearing,
    error:   offlineError,
    removeItem,
    clearAll,
    refresh: refreshOffline,
  } = useOfflineContent();

  // keep server list in sync with local offlineService actions if needed
  useEffect(() => { refreshOffline(); }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const storageUsed  = settings?.storage.used  ?? 0;
  const storageQuota = settings?.storage.quota ?? 0;
  const storagePercent = storageQuota > 0
    ? Math.min((storageUsed / storageQuota) * 100, 100)
    : 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 pt-24">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ── */}
        <header className="flex items-center gap-4 mb-12">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Cài đặt ứng dụng</h1>
        </header>

        {/* ── Global error banner ── */}
        {(settingsError || offlineError) && (
          <div className="flex items-center gap-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-8">
            <AlertCircle size={16} className="flex-shrink-0" />
            {settingsError ?? offlineError}
          </div>
        )}

        <div className="space-y-10">

          {/* ══════════ SECTION: Offline storage ══════════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Database size={20} />
              <h2 className="text-sm font-bold uppercase tracking-widest">
                Dung lượng ngoại tuyến
              </h2>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="p-6 space-y-6">

                {/* Storage bar */}
                {settingsLoading ? (
                  <div className="flex items-center gap-3 text-zinc-500">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Đang tải thông tin lưu trữ…</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Đã dùng để tải phim</span>
                      <span className="font-medium">
                        {formatSize(storageUsed)}
                        {storageQuota > 0 && ` / ${formatSize(storageQuota)}`}
                      </span>
                    </div>
                    {storageQuota > 0 && (
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-red-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(storagePercent, 1)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Content count + clear all */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">Nội dung đã tải</h3>
                    <p className="text-sm text-zinc-500">
                      {offlineLoading
                        ? 'Đang tải…'
                        : `${offlineItems.length} mục đã sẵn sàng xem khi không có mạng`}
                    </p>
                  </div>
                  <button
                    onClick={clearAll}
                    disabled={clearing || offlineItems.length === 0 || offlineLoading}
                    className="flex items-center gap-2 text-sm text-red-500 font-bold hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors disabled:opacity-30"
                  >
                    {clearing
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Trash2 size={18} />}
                    {clearing ? 'Đang xóa…' : 'Xóa tất cả'}
                  </button>
                </div>

                {/* Download quality selector */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Chất lượng tải về</h3>
                    <p className="text-xs text-zinc-500">
                      Chất lượng cao sẽ chiếm nhiều dung lượng hơn
                    </p>
                  </div>
                  {settingsLoading ? (
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                  ) : (
                    <select
                      value={settings?.download_quality ?? 'standard'}
                      onChange={e => updateQuality(e.target.value as DownloadQuality)}
                      className="bg-zinc-800 text-sm border-none rounded p-2 focus:ring-0 focus:outline-none"
                    >
                      {QUALITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* ── Offline items list ── */}
              {offlineLoading && (
                <div className="border-t border-zinc-800 p-6 flex items-center gap-3 text-zinc-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Đang tải danh sách…</span>
                </div>
              )}

              {!offlineLoading && offlineItems.length > 0 && (
                <div className="border-t border-zinc-800 bg-zinc-900/30 p-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-tight mb-4">
                    Các mục đã lưu
                  </p>
                  <div className="space-y-3">
                    {offlineItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.thumbnailUrl}
                            className="w-16 aspect-video object-cover rounded bg-zinc-800"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">
                              {item.type}
                              {item.size > 0 && ` · ${formatSize(item.size)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-zinc-500 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ══════════ SECTION: Profile ══════════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Shield size={20} />
              <h2 className="text-sm font-bold uppercase tracking-widest">
                Tài khoản & Hồ sơ
              </h2>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
              {settingsLoading ? (
                <div className="p-4 flex items-center gap-3 text-zinc-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Đang tải hồ sơ…</span>
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 flex items-center justify-center">
                      {settings?.profile.avatar ? (
                        <img
                          src={settings.profile.avatar}
                          alt={settings.profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-zinc-400">
                          {settings?.profile.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">
                        {settings?.profile.name ?? '—'}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {settings?.profile.email ?? '—'}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {settings?.profile.isKids
                          ? 'Chế độ trẻ em đang bật'
                          : 'Hồ sơ tiêu chuẩn'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/profiles')}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ══════════ SECTION: App info ══════════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <Info size={20} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Thông tin</h2>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
              <div className="p-4 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Phiên bản</span>
                {settingsLoading ? (
                  <Loader2 size={14} className="animate-spin text-zinc-500" />
                ) : (
                  <span className="font-mono">
                    {settings?.app_version ?? '—'}
                  </span>
                )}
              </div>
              <div className="p-4 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Trạng thái hệ thống</span>
                <span className="text-blue-500 font-medium">Local Only</span>
              </div>
              <div className="p-4 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Bộ nhớ đã dùng</span>
                {settingsLoading ? (
                  <Loader2 size={14} className="animate-spin text-zinc-500" />
                ) : (
                  <span className="font-mono">
                    {formatSize(storageUsed)}
                  </span>
                )}
              </div>
            </div>
          </section>

        </div>

        {/* ── Footer ── */}
        {!settingsLoading && settings && (
          <div className="mt-12 text-center">
            <p className="text-zinc-600 text-xs italic">
              Email tài khoản: {settings.profile.email}
            </p>
            <p className="text-zinc-700 text-[10px] mt-2 font-mono uppercase tracking-[0.2em]">
              FamilyFlix • Kỷ niệm của gia đình
            </p>
          </div>
        )}

      </div>
    </div>
  );
}