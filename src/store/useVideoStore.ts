import { create } from 'zustand';
import { getAllVideos, addVideo as addVideoToDB, removeVideo as removeVideoFromDB, type VideoItem } from '../lib/database';

type State = {
  videos: VideoItem[];
  isLoading: boolean;
  isHydrated: boolean;
  loadVideos: () => Promise<void>;
  addVideo: (v: VideoItem) => Promise<void>;
  removeVideo: (id: string) => Promise<void>;
};

export const useVideoStore = create<State>((set, get) => ({
  videos: [],
  isLoading: false,
  isHydrated: false,
  
  loadVideos: async () => {
    set({ isLoading: true });
    try {
      const videos = await getAllVideos();
      set({ videos, isLoading: false, isHydrated: true });
      console.log('✅ Videos loaded from database:', videos.length);
    } catch (error) {
      console.error('❌ Error loading videos:', error);
      set({ isLoading: false, isHydrated: true });
    }
  },

  addVideo: async (v: VideoItem) => {
    try {
      await addVideoToDB(v);
      // Reload videos from database to ensure consistency
      const videos = await getAllVideos();
      set({ videos });
      console.log('✅ Video added and store updated');
    } catch (error) {
      console.error('❌ Error adding video:', error);
      throw error;
    }
  },

  removeVideo: async (id: string) => {
    try {
      await removeVideoFromDB(id);
      // Update local state immediately for better UX
      set((state) => ({
        videos: state.videos.filter((x) => x.id !== id),
      }));
      console.log('✅ Video removed and store updated');
    } catch (error) {
      console.error('❌ Error removing video:', error);
      throw error;
    }
  },
}));

