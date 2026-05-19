import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'video' | 'album';
  isKids: boolean;
  uploadedBy: number;
  thumbnailUrl: string;
  mediaUrl: string | null;
  albumPhotos: string[];
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  isKids: boolean;
}

export interface DashboardStats {
  total_content: number;
  total_users: number;
  storage_used: string;
  status: string;
}

export interface UploadContentPayload {
  title: string;
  description?: string;
  category: string;
  type: 'video' | 'album';
  is_kids: boolean;
  thumbnail: File;
  media_url?: string;           // required when type === 'video'
  album_photos?: File[];  // required when type === 'album'
}

export interface UploadProgressCallback {
  (percent: number): void;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {

  getDashboard: (): Promise<DashboardStats> =>
    api.get<DashboardStats>('/admin/dashboard').then(r => r.data),

  getContent: (): Promise<ContentItem[]> =>
    api.get<ContentItem[]>('/admin/content').then(r => r.data),

  uploadContent: (
    payload: UploadContentPayload,
    onProgress?: UploadProgressCallback,
  ): Promise<{ id: string; message: string; folder: string }> => {
    const form = new FormData();
    form.append('title',       payload.title);
    form.append('description', payload.description ?? '');
    form.append('category',    payload.category);
    form.append('type',        payload.type);
    form.append('is_kids',     payload.is_kids ? '1' : '0');
    form.append('thumbnail',   payload.thumbnail);

    if (payload.type === 'video' && payload.media_url) {
      form.append('media_url', payload.media_url);
    }

    payload.album_photos?.forEach(photo => {
      form.append('album_photos[]', photo);
    });

    return api.post('/admin/content', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }).then(r => r.data);
  },

  deleteContent: (id: string): Promise<{ message: string }> =>
    api.delete(`/admin/content/${id}`).then(r => r.data),

  getUsers: (): Promise<AdminUser[]> =>
    api.get<AdminUser[]>('/admin/users').then(r => r.data),

  updateUserRole: (
    userId: number,
    role: 'admin' | 'member',
  ): Promise<{ message: string }> =>
    api.patch(`/admin/users/${userId}/role`, { role }).then(r => r.data),
};