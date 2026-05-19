import React from 'react';
import { motion } from 'motion/react';
import { Play, Trash2, Download } from 'lucide-react';
import { useLocalUrl } from '../hooks/useLocalUrl';
import { OfflineContent } from '../lib/offlineService';

interface OfflineCardProps {
  item: OfflineContent;
  onPlay: (item: OfflineContent) => void;
  onRemove: (id: string) => void;
}

export default function OfflineCard({ item, onPlay, onRemove }: OfflineCardProps) {
  const thumbUrl = useLocalUrl(item.localThumbnailPath);

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="flex-none w-48 md:w-64 aspect-video relative rounded overflow-hidden cursor-pointer group"
      onClick={() => onPlay(item)}
    >
      <img src={thumbUrl || item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
      <div className="absolute top-2 right-2 bg-blue-600 p-1 rounded-full">
        <Download size={12} className="text-white" />
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <Play fill="white" size={32} />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition"
        >
          <Trash2 size={20} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
        <p className="text-sm font-medium truncate">{item.title}</p>
      </div>
    </motion.div>
  );
}
