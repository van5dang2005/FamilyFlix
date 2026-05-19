import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

const MOCK_CONTENT = [
  {
    title: "Summer Vacation 2025 - Hawaii",
    description: "Our amazing trip to Maui and Honolulu. Surfing, hiking, and family dinners.",
    category: "Travel",
    type: "video",
    isKids: false,
    thumbnailUrl: "https://picsum.photos/seed/hawaii/1280/720",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    createdAt: new Date()
  },
  {
    title: "Baby Leo's First Steps",
    description: "The moment we've all been waiting for! Leo finally started walking in the living room.",
    category: "Kids",
    type: "video",
    isKids: true,
    thumbnailUrl: "https://picsum.photos/seed/baby/1280/720",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    createdAt: new Date()
  },
  {
    title: "Christmas Morning 2024",
    description: "Opening presents and having breakfast together. Pure family joy.",
    category: "Home Movies",
    type: "video",
    isKids: true,
    thumbnailUrl: "https://picsum.photos/seed/christmas/1280/720",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    createdAt: new Date()
  },
  {
    title: "Grandpa's 80th Birthday",
    description: "A collection of photos from the big celebration at the park.",
    category: "Events",
    type: "album",
    isKids: false,
    thumbnailUrl: "https://picsum.photos/seed/birthday/1280/720",
    mediaUrl: "https://picsum.photos/seed/party/1920/1080",
    createdAt: new Date()
  },
  {
    title: "Weekend at the Lake",
    description: "Fishing and boating with the cousins.",
    category: "Travel",
    type: "video",
    isKids: false,
    thumbnailUrl: "https://picsum.photos/seed/lake/1280/720",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    createdAt: new Date()
  }
];

export async function seedDatabase() {
 
}
