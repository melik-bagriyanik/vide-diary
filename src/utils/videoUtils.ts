import * as FileSystem from 'expo-file-system/legacy';
import { TRIMMED_VIDEOS_DIR } from '../constants/videoConstants';
import { logger } from './logger';

/**
 * Generates a thumbnail from a video URI
 * @param videoUri - The video URI to generate thumbnail from
 * @param fallbackUri - Optional fallback URI if main URI fails
 * @returns Thumbnail URI or null if generation fails
 */
export async function generateThumbnail(
  videoUri: string,
  fallbackUri?: string
): Promise<string | null> {
  try {
    const VideoThumbnails = await import('expo-video-thumbnails');

    // Try from main video URI first
    try {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.8,
      });
      return thumbnailUri;
    } catch (firstError: unknown) {
      // If fallback URI provided, try that
      if (fallbackUri && fallbackUri !== videoUri) {
        try {
          const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(fallbackUri, {
            time: 0,
            quality: 0.8,
          });
          return thumbnailUri;
        } catch {
          // Ignore fallback error
        }
      }
      throw firstError;
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    if (
      errorMessage.includes('Cannot find native module') ||
      errorMessage.includes('expo-video-thumbnails') ||
      errorMessage.includes('native module')
    ) {
      logger.error(
        'Video thumbnails requires development build. Run: npx expo run:ios or npx expo run:android'
      );
    } else {
      logger.error('Thumbnail generation error:', errorMessage);
    }
    return null;
  }
}

/**
 * Ensures trimmed_videos directory exists
 */
export async function ensureTrimmedVideosDirectory(): Promise<string> {
  const trimmedDir = `${FileSystem.documentDirectory}${TRIMMED_VIDEOS_DIR}`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(trimmedDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(trimmedDir, { intermediates: true });
    }
  } catch (error) {
    logger.error('Error ensuring trimmed_videos directory:', error);
  }
  return trimmedDir;
}
