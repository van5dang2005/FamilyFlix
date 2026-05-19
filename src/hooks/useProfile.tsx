import { useState, useEffect, useCallback } from 'react';
import {
  profileService,
  Profile,
  CreateProfilePayload,
  UpdateProfilePayload,
} from '../services/profileService';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProfiles(await profileService.getAll());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create ────────────────────────────────────────────────────────────────

  const createProfile = useCallback(async (payload: CreateProfilePayload): Promise<Profile | null> => {
    try {
      setError(null);
      const created = await profileService.create(payload);
      setProfiles(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
      return null;
    }
  }, []);

  // ── Update ────────────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (id: string, payload: UpdateProfilePayload): Promise<Profile | null> => {
    try {
      setError(null);
      const updated = await profileService.update(id, payload);
      setProfiles(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
      return null;
    }
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await profileService.remove(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
      return false;
    }
  }, []);

  return {
    profiles,
    loading,
    error,
    refresh: load,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}