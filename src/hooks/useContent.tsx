import { useState, useEffect, useCallback } from 'react';
import {
  contentService,
  ContentItem,
  ContentListParams,
} from '../services/contentService';

// ─── useContentList ───────────────────────────────────────────────────────────
// Home page: fetch all contents, optional filters

export function useContentList(params?: ContentListParams) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setContent(await contentService.getAll(params));
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  return { content, loading, error, refresh: load };
}

// ─── useContentDetail ─────────────────────────────────────────────────────────
// ContentDetail page: single item + interaction state + actions

export function useContentDetail(id: string | undefined) {
  const [content,   setContent]   = useState<ContentItem | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [toggling,  setToggling]  = useState<'list' | 'like' | 'download' | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      setContent(await contentService.getById(id));
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle My List ──────────────────────────────────────────────────────────
  const toggleList = useCallback(async () => {
    if (!id || toggling) return;
    try {
      setToggling('list');
      const res = await contentService.toggleList(id);
      setContent(prev => prev ? { ...prev, isInList: res.isInList } : prev);
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setToggling(null);
    }
  }, [id, toggling]);

  // ── Toggle Like ─────────────────────────────────────────────────────────────
  const toggleLike = useCallback(async () => {
    if (!id || toggling) return;
    try {
      setToggling('like');
      const res = await contentService.toggleLike(id);
      setContent(prev => prev ? { ...prev, isLiked: res.isLiked } : prev);
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setToggling(null);
    }
  }, [id, toggling]);

  // ── Download ────────────────────────────────────────────────────────────────
  const download = useCallback(async (): Promise<{
    mediaUrl: string | null;
    albumPhotos: string[];
  } | null> => {
    if (!id || toggling) return null;
    try {
      setToggling('download');
      const res = await contentService.download(id);
      setContent(prev => prev ? { ...prev, isDownloaded: res.isDownloaded } : prev);
      return { mediaUrl: res.mediaUrl, albumPhotos: res.albumPhotos };
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
      return null;
    } finally {
      setToggling(null);
    }
  }, [id, toggling]);

  return {
    content, loading, error, toggling,
    toggleList, toggleLike, download,
    refresh: load,
  };
}

// ─── useMyList ────────────────────────────────────────────────────────────────
// My List section on Home

export function useMyList() {
  const [myList,  setMyList]  = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMyList(await contentService.getMyList());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { myList, loading, error, refresh: load };
}