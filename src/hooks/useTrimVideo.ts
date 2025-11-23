import { useMutation } from '@tanstack/react-query';
import { trimVideo } from 'expo-trim-video';
import { logger } from '../utils/logger';

type TrimParams = {
  uri: string;
  start: number; // seconds
  end: number; // seconds
};

type TrimResult = {
  uri: string;
  success: boolean;
  error?: string;
};

export function useTrimVideo() {
  return useMutation({
    mutationFn: async ({ uri, start, end }: TrimParams): Promise<TrimResult> => {
      try {
        // Call trimVideo from expo-trim-video (https://github.com/yemirhan/expo-trim-video)
        // API: trimVideo({ uri, start, end }) returns Promise<{ uri: string }>
        const result = await trimVideo({
          uri,
          start, // Start time in seconds (must be >= 0)
          end,   // End time in seconds (must be > start and <= video duration)
        });
        
        // According to GitHub docs: https://github.com/yemirhan/expo-trim-video
        // Result is { uri: string } - file URI of the trimmed video
        const trimmedUri = result?.uri;
        
        if (!trimmedUri) {
          // Trim didn't produce a new URI
          return {
            uri,
            success: false,
            error: 'Video trimming did not produce a new file',
          };
        }
        
        if (trimmedUri === uri) {
          // Same URI returned - trimming might have failed silently
          return {
            uri,
            success: false,
            error: 'Video trimming returned the same URI',
          };
        }
        
        logger.log('Video trimmed successfully:', trimmedUri);
        return {
          uri: trimmedUri,
          success: true,
        };
      } catch (trimError: unknown) {
        logger.error('Video trimming failed:', trimError);
        
        // Handle specific error codes from expo-trim-video
        // Error codes: INVALID_ARGUMENTS, INVALID_START, INVALID_END, INVALID_RANGE,
        //              INVALID_URI, FILE_NOT_FOUND, TRIM_ERROR
        const errorMessage = 
          (trimError instanceof Error ? trimError.message : String(trimError)) || 'Video trimming failed';
        
        // Map error codes to user-friendly messages
        let userFriendlyError = errorMessage;
        if (errorMessage.includes('INVALID_ARGUMENTS') || errorMessage.includes('Missing or invalid URI')) {
          userFriendlyError = 'Invalid video URI or parameters';
        } else if (errorMessage.includes('INVALID_START') || errorMessage.includes('Start time is negative')) {
          userFriendlyError = 'Start time is invalid (must be >= 0)';
        } else if (errorMessage.includes('INVALID_END') || errorMessage.includes('End time exceeds video duration')) {
          userFriendlyError = 'End time exceeds video duration';
        } else if (errorMessage.includes('INVALID_RANGE') || errorMessage.includes('Start time is greater than or equal to end time')) {
          userFriendlyError = 'Invalid time range (start must be < end)';
        } else if (errorMessage.includes('INVALID_URI') || errorMessage.includes('Invalid URI format')) {
          userFriendlyError = 'Invalid video URI format';
        } else if (errorMessage.includes('FILE_NOT_FOUND') || errorMessage.includes('Video file not found')) {
          userFriendlyError = 'Video file not found or inaccessible';
        } else if (errorMessage.includes('TRIM_ERROR') || errorMessage.includes('Error during video processing')) {
          userFriendlyError = 'Error during video processing';
        } else if (errorMessage.includes('native module') || errorMessage.includes('Cannot find native module')) {
          userFriendlyError = 'Video trimming requires a development build. Please run: npx expo run:ios or npx expo run:android';
        }
        
        return {
          uri,
          success: false,
          error: userFriendlyError,
        };
      }
    },
  });
}
