import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

export function useVideoUriFix(videoUri: string | undefined) {
  const router = useRouter();
  const [fixedUri, setFixedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoUri) {
      setIsLoading(false);
      return;
    }

    const fixVideoUri = async () => {
      let uri = videoUri;

      // Try URI as-is
      try {
        const directInfo = await FileSystem.getInfoAsync(uri);
        if (directInfo.exists && !directInfo.isDirectory) {
          setFixedUri(uri);
          setIsLoading(false);
          return;
        }
      } catch {
        // Continue to next step
      }

      // Try with file:// prefix
      if (!uri.startsWith('file://') && !uri.startsWith('http')) {
        try {
          const uriWithPrefix = `file://${uri}`;
          const info = await FileSystem.getInfoAsync(uriWithPrefix);
          if (info.exists && !info.isDirectory) {
            setFixedUri(uriWithPrefix);
            setIsLoading(false);
            return;
          }
        } catch {
          // Continue
        }
      }

      // Check if absolute path - try to find in trimmed_videos
      const uriForCheck = uri.replace(/^file:\/\//, '');
      const isAbsolutePath =
        uriForCheck.startsWith('/Users/') ||
        uriForCheck.startsWith('/var/') ||
        uri.includes('/Documents/trimmed_videos/') ||
        uri.includes('trimmed_videos/');

      if (isAbsolutePath) {
        const fileName = uriForCheck.split('/').pop() || uri.split('/').pop() || `video_${Date.now()}.mp4`;
        const trimmedDir = `${FileSystem.documentDirectory}trimmed_videos/`;
        const trimmedPath = `${trimmedDir}${fileName}`;

        try {
          await ensureDirectory(trimmedDir);
          const info = await FileSystem.getInfoAsync(trimmedPath);
          if (info.exists && !info.isDirectory) {
            setFixedUri(trimmedPath);
            setIsLoading(false);
            return;
          }

          // Try finding by filename
          const dirInfo = await FileSystem.getInfoAsync(trimmedDir);
          if (dirInfo.exists && dirInfo.isDirectory) {
            const files = await FileSystem.readDirectoryAsync(trimmedDir);
            const matchingFile = files.find(
              (f) => f === fileName || f.includes(fileName.split('.')[0])
            );
            if (matchingFile) {
              setFixedUri(`${trimmedDir}${matchingFile}`);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Continue
        }
      }

      // Last resort: try as-is (might be HTTP or other format)
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        setFixedUri(fileInfo.exists ? uri : uri);
      } catch {
        setFixedUri(uri);
      }

      setIsLoading(false);
    };

    fixVideoUri();
  }, [videoUri]);

  async function ensureDirectory(dir: string) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    } catch {
      // Ignore
    }
  }

  return { fixedUri, isLoading };
}
