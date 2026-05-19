import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { openDB, IDBPDatabase } from 'idb';

export interface OfflineContent {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  mediaUrl: string;
  type: 'video' | 'album';
  category: string;
  localThumbnailPath?: string;
  localMediaPath?: string;
  localAlbumPhotos?: string[];
  localThumbnailBlob?: Blob;
  localMediaBlob?: Blob;
  downloadedAt: string;
}

const OFFLINE_CONTENT_KEY = 'offline_content_list';
const DB_NAME = 'FamilyFlixOffline';
const STORE_NAME = 'media';

class OfflineService {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private getDB() {
    if (!this.dbPromise) {
      if (!Capacitor.isNativePlatform()) {
        this.dbPromise = openDB(DB_NAME, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          },
        });
      }
    }
    return this.dbPromise;
  }

  async isOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  async getOfflineContentList(): Promise<OfflineContent[]> {
    const { value } = await Preferences.get({ key: OFFLINE_CONTENT_KEY });
    const list: OfflineContent[] = value ? JSON.parse(value) : [];
    
    // On web, we need to re-attach blobs from DB if they were stored as such
    // However, Preferences only stores JSON. We'll store the metadata in Preferences 
    // and the highlander blobs in IDB.
    return list;
  }

  async saveOfflineContentList(list: OfflineContent[]) {
    await Preferences.set({
      key: OFFLINE_CONTENT_KEY,
      value: JSON.stringify(list),
    });
  }

  async isDownloaded(id: string): Promise<boolean> {
    const list = await this.getOfflineContentList();
    return list.some(item => item.id === id);
  }

  async downloadContent(content: any): Promise<void> {
    const list = await this.getOfflineContentList();
    if (list.some(item => item.id === content.id)) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Implementation
        const thumbFileName = `thumb_${content.id}.${content.thumbnailUrl.split('.').pop()?.split('?')[0] || 'jpg'}`;
        const thumbResult = await Filesystem.downloadFile({
          url: content.thumbnailUrl,
          path: `downloads/${thumbFileName}`,
          directory: Directory.Data,
        });

        const mediaFileName = `media_${content.id}.${content.mediaUrl.split('.').pop()?.split('?')[0] || (content.type === 'video' ? 'mp4' : 'jpg')}`;
        const mediaResult = await Filesystem.downloadFile({
          url: content.mediaUrl,
          path: `downloads/${mediaFileName}`,
          directory: Directory.Data,
        });

        const localAlbumPhotos: string[] = [];
        if (content.albumPhotos && content.albumPhotos.length > 0) {
          for (let i = 0; i < content.albumPhotos.length; i++) {
            const photoUrl = content.albumPhotos[i];
            const fileName = `album_${content.id}_${i}.${photoUrl.split('.').pop()?.split('?')[0] || 'jpg'}`;
            const result = await Filesystem.downloadFile({
              url: photoUrl,
              path: `downloads/${fileName}`,
              directory: Directory.Data,
            });
            localAlbumPhotos.push(result.path);
          }
        }

        const offlineItem: OfflineContent = {
          ...content,
          localThumbnailPath: thumbResult.path,
          localMediaPath: mediaResult.path,
          localAlbumPhotos,
          downloadedAt: new Date().toISOString(),
        };
        list.push(offlineItem);
      } else {
        // Web Implementation using IndexedDB
        const db = await this.getDB();
        if (!db) throw new Error('IndexedDB not supported');

        const downloadPromises = [
          fetch(content.thumbnailUrl).then(r => r.blob()),
          fetch(content.mediaUrl).then(r => r.blob())
        ];

        const localAlbumPhotos: string[] = [];
        if (content.albumPhotos && content.albumPhotos.length > 0) {
          content.albumPhotos.forEach((url: string, i: number) => {
            downloadPromises.push(fetch(url).then(r => r.blob()));
            localAlbumPhotos.push(`album_${content.id}_${i}`);
          });
        }

        const blobs = await Promise.all(downloadPromises);
        const [thumbBlob, mediaBlob, ...albumBlobs] = blobs;

        const writePromises = [
          db.put(STORE_NAME, thumbBlob, `thumb_${content.id}`),
          db.put(STORE_NAME, mediaBlob, `media_${content.id}`)
        ];

        albumBlobs.forEach((blob, i) => {
          writePromises.push(db.put(STORE_NAME, blob, localAlbumPhotos[i]));
        });

        await Promise.all(writePromises);

        const offlineItem: OfflineContent = {
          ...content,
          localThumbnailPath: `thumb_${content.id}`,
          localMediaPath: `media_${content.id}`,
          localAlbumPhotos,
          downloadedAt: new Date().toISOString(),
        };
        list.push(offlineItem);
      }

      await this.saveOfflineContentList(list);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  async removeContent(id: string): Promise<void> {
    const list = await this.getOfflineContentList();
    const item = list.find(i => i.id === id);
    
    if (item) {
      try {
        if (Capacitor.isNativePlatform()) {
          if (item.localThumbnailPath) await Filesystem.deleteFile({ path: item.localThumbnailPath });
          if (item.localMediaPath) await Filesystem.deleteFile({ path: item.localMediaPath });
          if (item.localAlbumPhotos) {
            for (const path of item.localAlbumPhotos) {
              await Filesystem.deleteFile({ path });
            }
          }
        } else {
          const db = await this.getDB();
          if (db) {
            await db.delete(STORE_NAME, `thumb_${id}`);
            await db.delete(STORE_NAME, `media_${id}`);
            if (item.localAlbumPhotos) {
              for (const key of item.localAlbumPhotos) {
                await db.delete(STORE_NAME, key);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error deleting files, they might already be gone:', e);
      }

      const newList = list.filter(i => i.id !== id);
      await this.saveOfflineContentList(newList);
    }
  }

  async getLocalUrl(idOrPath: string): Promise<string> {
    if (!idOrPath) return '';

    if (Capacitor.isNativePlatform()) {
      const uri = await Filesystem.getUri({
        path: idOrPath,
        directory: Directory.Data,
      });
      return Capacitor.convertFileSrc(uri.uri);
    } else {
      const db = await this.getDB();
      if (!db) return '';
      const blob = await db.get(STORE_NAME, idOrPath);
      if (blob) {
        return URL.createObjectURL(blob);
      }
      return '';
    }
  }

  async clearAllContent(): Promise<void> {
    const list = await this.getOfflineContentList();
    for (const item of list) {
      await this.removeContent(item.id);
    }
  }

  async getStorageInfo(): Promise<{ used: number; quota?: number }> {
    if (Capacitor.isNativePlatform()) {
      const list = await this.getOfflineContentList();
      return { used: list.length * 50 * 1024 * 1024 }; // Estimate
    } else {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return { 
          used: estimate.usage || 0, 
          quota: estimate.quota 
        };
      }
      const list = await this.getOfflineContentList();
      return { used: list.length * 50 * 1024 * 1024 };
    }
  }
}

export const offlineService = new OfflineService();
