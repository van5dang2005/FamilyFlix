import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DownloadQuality = 'standard' | 'high' | 'ultra';

export interface StorageInfo {
  used: number;
  quota: number;
}

export interface SettingProfile {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  isKids: boolean;
}

export interface Settings {
  storage: StorageInfo;
  download_quality: DownloadQuality;
  profile: SettingProfile;
  app_version: string;
}

export interface OfflineContentItem {
  id: string;
  title: string;
  type: 'video' | 'album';
  thumbnailUrl: string;
  size: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const settingService = {

  /** GET /api/settings */
  getSettings: (): Promise<Settings> =>
    api.get<Settings>('/settings').then(r => r.data),

  /** PATCH /api/settings/quality */
  updateQuality: (
    download_quality: DownloadQuality,
  ): Promise<{ message: string; download_quality: DownloadQuality }> =>
    api.patch('/settings/quality', { download_quality }).then(r => r.data),

  /** GET /api/settings/offline */
  getOfflineContent: (): Promise<OfflineContentItem[]> =>
    api.get<OfflineContentItem[]>('/settings/offline').then(r => r.data),

  /** DELETE /api/settings/offline/:id */
  removeOfflineContent: (id: string): Promise<{ message: string }> =>
    api.delete(`/settings/offline/${id}`).then(r => r.data),

  /** DELETE /api/settings/offline */
  clearAllOffline: (): Promise<{ message: string }> =>
    api.delete('/settings/offline').then(r => r.data),
};