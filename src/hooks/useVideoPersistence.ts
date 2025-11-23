import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../utils/logger';

export function useVideoPersistence(originalUri: string | undefined) {
  const [finalUri, setFinalUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    async function persistVideo() {
      if (!originalUri) {
        setError('No video URI provided');
        setIsLoading(false);
        return;
      }

      // For HTTP URLs, use directly
      if (originalUri.startsWith('http')) {
        setFinalUri(originalUri);
        setIsLoading(false);
        return;
      }

      // For local files, copy to app cache
      try {
        setIsCopying(true);
        const fileName = originalUri.split('/').pop() || 'video.mp4';
        const cacheUri = `${FileSystem.cacheDirectory}persistent_${Date.now()}_${fileName}`;

        await FileSystem.copyAsync({
          from: originalUri,
          to: cacheUri,
        });

        setFinalUri(cacheUri);
        setIsCopying(false);
        setIsLoading(false);
      } catch (copyError: unknown) {
        logger.error('Error copying video to cache:', copyError);
        setFinalUri(originalUri);
        setIsCopying(false);
        setIsLoading(false);
      }
    }

    persistVideo();
  }, [originalUri]);

  return { finalUri, isLoading, error, isCopying };
}
