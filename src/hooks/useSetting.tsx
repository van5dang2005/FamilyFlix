import { useState, useEffect, useCallback } from 'react';
import {
  settingService,
  Settings,
  OfflineContentItem,
  DownloadQuality,
} from '../services/settingService';

// ─── useSettings ─────────────────────────────────────────────────────────────
// Fetch main settings (storage info, profile, quality)

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSettings(await settingService.getSettings());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Update download quality ─────────────────────────────────────────────────
  const updateQuality = useCallback(async (quality: DownloadQuality) => {
    try {
      const res = await settingService.updateQuality(quality);
      setSettings(prev =>
        prev ? { ...prev, download_quality: res.download_quality } : prev
      );
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    }
  }, []);

  return { settings, loading, error, updateQuality, refresh: load };
}

// ─── useOfflineContent ────────────────────────────────────────────────────────
// Manage server-side offline (downloaded) content list

export function useOfflineContent() {
  const [items, setItems]     = useState<OfflineContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await settingService.getOfflineContent());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Remove single item ──────────────────────────────────────────────────────
  const removeItem = useCallback(async (id: string) => {
    try {
      await settingService.removeOfflineContent(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    }
  }, []);

  // ── Clear all ───────────────────────────────────────────────────────────────
  const clearAll = useCallback(async () => {
    if (!window.confirm('Xác nhận xóa toàn bộ nội dung tải về? Thao tác này không thể hoàn tác.')) return;
    setClearing(true);
    try {
      await settingService.clearAllOffline();
      setItems([]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setClearing(false);
    }
  }, []);

  return { items, loading, clearing, error, removeItem, clearAll, refresh: load };
}