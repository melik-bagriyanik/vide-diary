import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useTrimVideo } from './useTrimVideo';
import { generateThumbnail, ensureTrimmedVideosDirectory } from '../utils/videoUtils';
import { TRIMMED_VIDEOS_DIR } from '../constants/videoConstants';
import { logger } from '../utils/logger';

interface VideoProcessingResult {
  finalUri: string;
  thumbnailUri?: string;
}

export function useVideoProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const trimMutation = useTrimVideo();

  const processVideo = async (
    uri: string,
    startTime: number,
    endTime: number
  ): Promise<VideoProcessingResult> => {
    setIsProcessing(true);

    try {
      // Trim video
      const trimResult = await trimMutation.mutateAsync({
        uri,
        start: startTime,
        end: endTime,
      });

      if (!trimResult.success || !trimResult.uri) {
        throw new Error(trimResult.error || 'Video trimming failed');
      }

      const trimmedUri = trimResult.uri;
      let finalUri = trimmedUri;

      // Check if already in correct location
      const trimmedDir = `${FileSystem.documentDirectory}${TRIMMED_VIDEOS_DIR}`;
      const isAlreadyInCorrectLocation = trimmedUri.includes(TRIMMED_VIDEOS_DIR);

      if (!isAlreadyInCorrectLocation) {
        // Ensure directory exists
        await ensureTrimmedVideosDirectory();

        // Copy to permanent location
        const fileName = `trimmed_${Date.now()}.mp4`;
        const permanentUri = `${trimmedDir}${fileName}`;

        try {
          await FileSystem.copyAsync({
            from: trimmedUri,
            to: permanentUri,
          });

          // Verify copy
          const verifyInfo = await FileSystem.getInfoAsync(permanentUri);
          if (verifyInfo.exists) {
            finalUri = permanentUri.replace(/^file:\/\/file:\/\//, 'file://');
          }
        } catch (copyError) {
          logger.error('Error copying trimmed video:', copyError);
          // Use trimmed URI as fallback
        }
      } else {
        // Verify file exists
        try {
          const verifyInfo = await FileSystem.getInfoAsync(trimmedUri);
          if (!verifyInfo.exists) {
            throw new Error('Trimmed video file not found');
          }
        } catch (verifyError) {
          logger.error('Error verifying trimmed video:', verifyError);
        }
      }

      // Generate thumbnail
      const thumbnailUri = await generateThumbnail(finalUri, uri);

      return {
        finalUri,
        thumbnailUri: thumbnailUri || undefined,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processVideo,
    isProcessing: isProcessing || trimMutation.isPending,
  };
}
