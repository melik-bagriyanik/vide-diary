import { create } from 'zustand';
import { getAllVideos, addVideo as addVideoToDB, removeVideo as removeVideoFromDB, updateVideo as updateVideoInDB, type VideoItem } from '../lib/database';
import { logger } from '../utils/logger';

type State = {
  videos: VideoItem[];
  isLoading: boolean;
  isHydrated: boolean;
  loadVideos: () => Promise<void>;
  addVideo: (v: VideoItem) => Promise<void>;
  removeVideo: (id: string) => Promise<void>;
  updateVideo: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
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
      logger.log('Videos loaded from database:', videos.length);
    } catch (error) {
      logger.error('Error loading videos:', error);
      set({ isLoading: false, isHydrated: true });
    }
  },

  addVideo: async (v: VideoItem) => {
    try {
      await addVideoToDB(v);
      // Reload videos from database to ensure consistency
      const videos = await getAllVideos();
      set({ videos });
      logger.log('Video added and store updated');
    } catch (error) {
      logger.error('Error adding video:', error);
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
      logger.log('Video removed and store updated');
    } catch (error) {
      logger.error('Error removing video:', error);
      throw error;
    }
  },

  updateVideo: async (id: string, updates: { name?: string; description?: string }) => {
    try {
      await updateVideoInDB(id, updates);
      // Reload videos from database to ensure consistency
      const videos = await getAllVideos();
      set({ videos });
      logger.log('Video updated and store refreshed');
    } catch (error) {
      logger.error('Error updating video:', error);
      throw error;
    }
  },
}));

