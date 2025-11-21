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
    const module = await import('expo-trim-video');
    
    if (!module) {
      isTrimVideoAvailable = false;
      return false;
    }

    // Check if trimVideo function exists
    if (typeof module.trimVideo !== 'function') {
      console.warn('⚠️ expo-trim-video module loaded but trimVideo function not available');
      isTrimVideoAvailable = false;
      return false;
    }

    trimVideoFunction = module.trimVideo;
    isTrimVideoAvailable = true;
    console.log('✅ expo-trim-video is available');
    return true;
  } catch (error: any) {
    // Import failed - native module not available
    // This is expected in Expo Go
    const errorMsg = error?.message || String(error) || '';
    
    // Check for various error conditions
    if (
      errorMsg.includes('Cannot find native module') ||
      errorMsg.includes('ExpoTrimVideo') ||
      errorMsg.includes('native module') ||
      errorMsg.includes('is not a function') ||
      errorMsg.includes('is undefined') ||
      error?.code === 'MODULE_NOT_FOUND'
    ) {
      console.warn('⚠️ expo-trim-video native module not available (expected in Expo Go)');
      isTrimVideoAvailable = false;
      return false;
    }
    
    // Other errors - log and return false
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
        // Trim not available - return original URI (silent fallback)
        return {
          uri,
          success: false,
          error: 'Video trimming requires a development build. Using original video.',
        };
      }

      try {
        // Call trimVideo function
        const result = await trimVideoFunction({ uri, start, end });
        
        // Handle different result formats
        const trimmedUri = result?.uri || result?.outputUri || result?.output || uri;
        
        if (!trimmedUri || trimmedUri === uri) {
          // Trim didn't produce a new URI
          return {
            uri,
            success: false,
            error: 'Video trimming did not produce a new file',
          };
        }
        
        return {
          uri: trimmedUri,
          success: true,
        };
      } catch (trimError: any) {
        console.error('❌ Video trimming failed:', trimError);
        return {
          uri,
          success: false,
          error: trimError?.message || 'Video trimming failed',
        };
      }
    },
  });
}
