import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'video' | 'album';
  isKids: boolean;
  thumbnailUrl: string;
  mediaUrl: string | null;
  albumPhotos: string[];
  duration: number | null;
  createdAt: string;
  // interaction state (only on detail)
  isInList?: boolean;
  isLiked?: boolean;
  isDownloaded?: boolean;
}

export interface ContentListParams {
  category?: string;
  type?: 'video' | 'album';
  is_kids?: boolean;
}

export interface ToggleResponse {
  message: string;
  isInList?: boolean;
  isLiked?: boolean;
}

export interface DownloadResponse {
  isDownloaded: boolean;
  message: string;
  mediaUrl: string | null;
  albumPhotos: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const contentService = {

  /** GET /api/contents */
  getAll: (params?: ContentListParams): Promise<ContentItem[]> =>
    api.get<ContentItem[]>('/contents', { params }).then(r => r.data),

  /** GET /api/contents/{id} */
  getById: (id: string): Promise<ContentItem> =>
    api.get<ContentItem>(`/contents/${id}`).then(r => r.data),

  /** POST /api/contents/{id}/list */
  toggleList: (id: string): Promise<ToggleResponse> =>
    api.post<ToggleResponse>(`/contents/${id}/list`).then(r => r.data),

  /** POST /api/contents/{id}/like */
  toggleLike: (id: string): Promise<ToggleResponse> =>
    api.post<ToggleResponse>(`/contents/${id}/like`).then(r => r.data),

  /** POST /api/contents/{id}/download */
  download: (id: string): Promise<DownloadResponse> =>
    api.post<DownloadResponse>(`/contents/${id}/download`).then(r => r.data),

  /** GET /api/contents/my-list */
  getMyList: (): Promise<ContentItem[]> =>
    api.get<ContentItem[]>('/contents/my-list').then(r => r.data),
};