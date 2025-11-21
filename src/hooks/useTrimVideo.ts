import { useMutation } from '@tanstack/react-query';

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

// Cache for availability check
let isTrimVideoAvailable: boolean | null = null;
let trimVideoFunction: any = null;

async function checkTrimVideoAvailability(): Promise<boolean> {
  // Return cached result if already checked
  if (isTrimVideoAvailable !== null) {
    return isTrimVideoAvailable;
  }

  try {
    // Try to dynamically import the module
    // This will fail if native module is not available
    // We need to catch the error at import time
    let module: any;
    try {
      module = await import('expo-trim-video');
    } catch (importError: any) {
      // Import failed - native module not available
      const errorMsg = importError?.message || String(importError) || '';
      if (
        errorMsg.includes('Cannot find native module') ||
        errorMsg.includes('ExpoTrimVideo') ||
        errorMsg.includes('native module') ||
        importError?.code === 'MODULE_NOT_FOUND'
      ) {
        console.warn('⚠️ expo-trim-video native module not available (expected in Expo Go)');
        isTrimVideoAvailable = false;
        return false;
      }
      throw importError; // Re-throw if it's a different error
    }
    
    if (!module) {
      isTrimVideoAvailable = false;
      return false;
    }

    // Check if trimVideo function exists
    if (typeof module.trimVideo !== 'function') {
      // Silent fail - this is expected in Expo Go
      isTrimVideoAvailable = false;
      return false;
    }

    trimVideoFunction = module.trimVideo;
    isTrimVideoAvailable = true;
    console.log('✅ expo-trim-video is available');
    return true;
  } catch (error: any) {
    // Any other error - log and return false
    const errorMsg = error?.message || String(error) || '';
    console.warn('⚠️ expo-trim-video check failed:', errorMsg);
    isTrimVideoAvailable = false;
    return false;
  }
}

export function useTrimVideo() {
  return useMutation({
    mutationFn: async ({ uri, start, end }: TrimParams): Promise<TrimResult> => {
      // Check if trim video is available (lazy check, cached)
      const isAvailable = await checkTrimVideoAvailability();

      if (!isAvailable || !trimVideoFunction) {
        // Trim not available - return error
        return {
          uri,
          success: false,
          error: 'Video trimming requires a development build. Please run: npx expo run:ios or npx expo run:android',
        };
      }

      try {
        // Call trimVideo function according to expo-trim-video API
        // API: trimVideo({ uri, start, end }) returns { uri: string }
        const result = await trimVideoFunction({ 
          uri, 
          start, // Start time in seconds
          end    // End time in seconds
        });
        
        // According to GitHub docs, result is { uri: string }
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
        
        console.log('✅ Video trimmed successfully:', trimmedUri);
        return {
          uri: trimmedUri,
          success: true,
        };
      } catch (trimError: any) {
        console.error('❌ Video trimming failed:', trimError);
        
        // Handle specific error codes from expo-trim-video
        const errorMessage = trimError?.message || String(trimError) || 'Video trimming failed';
        
        // Map error codes to user-friendly messages
        let userFriendlyError = errorMessage;
        if (errorMessage.includes('INVALID_ARGUMENTS')) {
          userFriendlyError = 'Invalid video URI or parameters';
        } else if (errorMessage.includes('INVALID_START')) {
          userFriendlyError = 'Start time is invalid (must be >= 0)';
        } else if (errorMessage.includes('INVALID_END')) {
          userFriendlyError = 'End time exceeds video duration';
        } else if (errorMessage.includes('INVALID_RANGE')) {
          userFriendlyError = 'Invalid time range (start must be < end)';
        } else if (errorMessage.includes('FILE_NOT_FOUND')) {
          userFriendlyError = 'Video file not found or inaccessible';
        } else if (errorMessage.includes('TRIM_ERROR')) {
          userFriendlyError = 'Error during video processing';
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
