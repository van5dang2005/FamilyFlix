import { useState, useEffect } from 'react';
import { offlineService } from '../lib/offlineService';

export function useLocalUrl(pathOrId?: string) {
  const [url, setUrl] = useState(pathOrId || '');

  useEffect(() => {
    if (!pathOrId) return;
    
    // If it's already an http/https url, we don't need to do anything 
    // UNLESS we are specifically told it's a local path
    // But since our system uses the path as an ID or relative path, 
    // we should try to resolve it if it doesn't start with http
    if (pathOrId.startsWith('http')) {
      setUrl(pathOrId);
      return;
    }

    let isMounted = true;
    const fetchUrl = async () => {
      const localUrl = await offlineService.getLocalUrl(pathOrId);
      if (isMounted) setUrl(localUrl);
    };
    fetchUrl();
    
    return () => {
      isMounted = false;
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pathOrId]);

  return url;
}
