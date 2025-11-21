import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VideoItem = {
  id: string;
  name: string;
  description?: string;
  uri: string;
  createdAt: number;
};

type State = {
  videos: VideoItem[];
  addVideo: (v: VideoItem) => void;
  removeVideo: (id: string) => void;
};

export const useVideoStore = create<State>()(
  persist(
    (set) => ({
      videos: [],
      addVideo: (v) => set((s) => ({ videos: [v, ...s.videos] })),
      removeVideo: (id) => set((s) => ({ videos: s.videos.filter((x) => x.id !== id) })),
    }),
    {
      name: 'video-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

