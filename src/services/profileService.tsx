import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export interface CreateProfilePayload {
  name: string;
  isKids: boolean;
  avatar?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  isKids?: boolean;
  avatar?: string;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

// API returns isKids as '0' | '1' | 0 | 1 | boolean — normalize to boolean.
function normalizeProfile(raw: any): Profile {
  return {
    ...raw,
    isKids: raw.isKids === true || raw.isKids === 1 || raw.isKids === '1',
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const profileService = {

  /** GET /api/profiles */
  getAll: (): Promise<Profile[]> =>
    api.get<any[]>('/profiles').then(r => r.data.map(normalizeProfile)),

  /** POST /api/profiles */
  create: (payload: CreateProfilePayload): Promise<Profile> =>
    api.post<any>('/profiles', payload).then(r => normalizeProfile(r.data)),

  /** PATCH /api/profiles/{id} */
  update: (id: string, payload: UpdateProfilePayload): Promise<Profile> =>
    api.patch<any>(`/profiles/${id}`, payload).then(r => normalizeProfile(r.data)),

  /** DELETE /api/profiles/{id} */
  remove: (id: string): Promise<{ message: string }> =>
    api.delete(`/profiles/${id}`).then(r => r.data),
};