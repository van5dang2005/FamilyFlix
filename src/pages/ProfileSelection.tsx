import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LogOut, ShieldCheck, Trash2, Pencil,
  Check, X, AlertCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useProfile';
import { Profile } from '../services/profileService';

// ─── Deterministic avatar seed from profile id/name ──────────────────────────

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Bear', 'Cuddles', 'Daisy'];

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function resolveAvatar(profile: Profile, index: number): string {
  if (profile.avatar) return profile.avatar;
  return avatarUrl(AVATAR_SEEDS[index % AVATAR_SEEDS.length]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSelection() {
  const navigate = useNavigate();
  const { logoutUser, isAdmin } = useAuth();

  const {
    profiles, loading, error,
    createProfile, deleteProfile,
  } = useProfiles();

  const [isManaging, setIsManaging]       = useState(false);
  const [showAdd, setShowAdd]             = useState(false);
  const [newName, setNewName]             = useState('');
  const [isKidsProfile, setIsKidsProfile] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<Profile | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelect = (profile: Profile) => {
    if (isManaging) return;
    localStorage.setItem('active_profile', JSON.stringify(profile));
    navigate('/home');
  };

  const handleAdd = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    const avatarSeed = AVATAR_SEEDS[profiles.length % AVATAR_SEEDS.length];
    const result = await createProfile({
      name: newName.trim(),
      isKids: isKidsProfile,
      avatar: avatarUrl(avatarSeed),
    });
    setSaving(false);
    if (result) {
      setNewName('');
      setIsKidsProfile(false);
      setShowAdd(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const ok = await deleteProfile(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl text-white mb-3 font-medium"
      >
        {isManaging ? 'Manage Profiles' : "Who's watching?"}
      </motion.h1>

      {isManaging
        ? <p className="text-zinc-500 text-sm mb-10">Tap a profile to delete it</p>
        : <div className="mb-10" />
      }

      {/* Global error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile grid */}
      {loading ? (
        <div className="flex items-center gap-3 text-zinc-500 py-16">
          <Loader2 size={22} className="animate-spin" />
          <span>Loading profiles…</span>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
          <AnimatePresence>
            {profiles.map((profile, idx) => (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  onClick={() => isManaging ? setDeleteTarget(profile) : handleSelect(profile)}
                  className={`group w-32 h-32 md:w-40 md:h-40 rounded overflow-hidden border-4 transition-all relative ${
                    isManaging
                      ? 'border-zinc-600 hover:border-red-500'
                      : 'border-transparent hover:border-white'
                  }`}
                >
                  <img
                    src={resolveAvatar(profile, idx)}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  {profile.isKids && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-[10px] font-bold py-1 text-white text-center">
                      KIDS
                    </div>
                  )}
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={28} className="text-red-400" />
                    </div>
                  )}
                </button>
                <span className={`text-xl transition-colors ${isManaging ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {profile.name}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add profile card */}
          {!isManaging && profiles.length < 5 && (
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowAdd(true)}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded border-4 border-transparent flex items-center justify-center bg-zinc-800 group-hover:bg-zinc-700 transition-all">
                <Plus size={64} className="text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-zinc-500 group-hover:text-white text-xl transition-colors">Add Profile</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Bottom controls */}
      <div className="mt-14 flex flex-col items-center gap-5">
        <button
          onClick={() => setIsManaging(v => !v)}
          className="flex items-center gap-2 border border-zinc-600 text-zinc-400 hover:text-white hover:border-white px-8 py-2 transition-all uppercase tracking-widest text-sm"
        >
          {isManaging
            ? <><Check size={14} /> Done</>
            : <><Pencil size={14} /> Manage Profiles</>
          }
        </button>

        {isAdmin && (
          <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase">
            <ShieldCheck size={14} /> Admin Access Enabled
          </div>
        )}

        <button
          onClick={handleLogout}
          className="text-zinc-600 hover:text-red-500 flex items-center gap-2 transition-colors text-xs"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* ── Add Profile Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !saving && setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 p-8 rounded-lg w-full max-w-md border border-zinc-800"
            >
              <h2 className="text-3xl text-white mb-6 font-bold">Add Profile</h2>
              <div className="space-y-5">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Name"
                  autoFocus
                  className="w-full bg-zinc-800 text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-red-600 text-lg"
                />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isKidsProfile}
                    onChange={e => setIsKidsProfile(e.target.checked)}
                    className="w-5 h-5 accent-red-600"
                  />
                  <span className="text-zinc-400 group-hover:text-white transition-colors">
                    This is a Kids profile
                  </span>
                </label>
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim() || saving}
                    className="flex-1 bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 transition disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    disabled={saving}
                    className="flex-1 border border-zinc-700 text-white font-bold py-3 rounded hover:bg-zinc-800 transition disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 p-8 rounded-lg w-full max-w-sm border border-zinc-800 space-y-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={resolveAvatar(deleteTarget, profiles.indexOf(deleteTarget))}
                  className="w-14 h-14 rounded"
                  alt={deleteTarget.name}
                />
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Profile?</h3>
                  <p className="text-zinc-400 text-sm mt-0.5">{deleteTarget.name}</p>
                </div>
              </div>

              <p className="text-zinc-500 text-sm">
                This will permanently remove this profile. This action cannot be undone.
              </p>

              {profiles.length <= 1 && (
                <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded">
                  You must keep at least one profile.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={profiles.length <= 1 || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-2.5 rounded transition-colors flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Trash2 size={16} />
                  }
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 border border-zinc-700 text-white font-bold py-2.5 rounded hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}