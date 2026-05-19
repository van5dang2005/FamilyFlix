import { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  ContentItem,
  AdminUser,
  DashboardStats,
  UploadContentPayload,
} from '../services/adminService';

// ─── useAdmin (Dashboard stats) ───────────────────────────────────────────────

export function useAdmin() {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStats(await adminService.getDashboard());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, refresh: load };
}

// ─── useAdminContent ──────────────────────────────────────────────────────────

export function useAdminContent() {
  const [content, setContent]           = useState<ContentItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [progress, setProgress]         = useState(0);          // 0-100 real upload %
  const [uploadStep, setUploadStep]     = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Load list ──────────────────────────────────────────────────────────────

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setContent(await adminService.getContent());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  // ── Upload ─────────────────────────────────────────────────────────────────

  const upload = useCallback(async (payload: UploadContentPayload): Promise<boolean> => {
    setUploading(true);
    setProgress(0);
    setUploadStep('Đang chuẩn bị tệp...');
    setError(null);

    try {
      await adminService.uploadContent(payload, (pct) => {
        setProgress(pct);

        // Label by progress bracket
        if (pct < 30) {
          setUploadStep('Đang mã hóa & nén tệp...');
        } else if (pct < 70) {
          setUploadStep('Đang tải lên máy chủ...');
        } else if (pct < 95) {
          setUploadStep('Đang tối ưu hóa dung lượng...');
        } else {
          setUploadStep('Hoàn tất xử lý...');
        }
      });

      setProgress(100);
      setUploadStep('Đăng thành công!');
      await new Promise(r => setTimeout(r, 600));
      await loadContent();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Upload thất bại.');
      return false;
    } finally {
      setUploading(false);
      setUploadStep(null);
      setProgress(0);
    }
  }, [loadContent]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const confirmDelete  = useCallback((id: string) => setDeleteConfirm(id), []);
  const cancelDelete   = useCallback(() => setDeleteConfirm(null), []);

  const executeDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await adminService.deleteContent(deleteConfirm);
      setContent(prev => prev.filter(item => item.id !== deleteConfirm));
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setDeleteConfirm(null);
    }
  }, [deleteConfirm]);

  return {
    content, loading, uploading, progress, uploadStep,
    error, deleteConfirm,
    upload, confirmDelete, cancelDelete, executeDelete,
    refresh: loadContent,
  };
}

// ─── useAdminUsers ────────────────────────────────────────────────────────────

export function useAdminUsers() {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await adminService.getUsers());
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateRole = useCallback(async (userId: number, role: 'admin' | 'member') => {
    try {
      await adminService.updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message);
    }
  }, []);

  return { users, loading, error, updateRole, refresh: loadUsers };
}