import { useMutation } from '@tanstack/react-query';

type TrimParams = {
  uri: string;
  start: number; // seconds
  end: number; // seconds
};

export function useTrimVideo() {
  return useMutation({
    mutationFn: async ({ uri, start, end }: TrimParams) => {
      try {
        // Dynamic import to handle missing native module gracefully
        const trimVideoModule = await import('expo-trim-video');
        
        // Check if trimVideo function exists
        if (!trimVideoModule || typeof trimVideoModule.trimVideo !== 'function') {
          throw new Error(
            'expo-trim-video native module is not available.\n\n' +
            'This feature requires a development build.\n\n' +
            'Please rebuild the app with:\n' +
            '• npx expo run:ios (for iOS)\n' +
            '• npx expo run:android (for Android)\n\n' +
            'expo-trim-video cannot run in Expo Go.'
          );
        }

        const { trimVideo } = trimVideoModule;
        const result = await trimVideo({ uri, start, end });
        return result;
      } catch (importError: any) {
        console.error('❌ expo-trim-video import error:', importError);
        
        // Check for various error conditions
        const errorMessage = importError?.message || '';
        const errorCode = importError?.code || '';
        
        if (
          errorMessage.includes('Cannot find module') ||
          errorMessage.includes('ExpoTrimVideo') ||
          errorMessage.includes('native module') ||
          errorCode === 'MODULE_NOT_FOUND' ||
          errorMessage.includes('is not a function') ||
          errorMessage.includes('is undefined')
        ) {
          throw new Error(
            'expo-trim-video native module is not available.\n\n' +
            'This feature requires a development build.\n\n' +
            'Please rebuild the app with:\n' +
            '• npx expo run:ios (for iOS)\n' +
            '• npx expo run:android (for Android)\n\n' +
            'expo-trim-video cannot run in Expo Go.'
          );
        }
        
        // Re-throw other errors
        throw importError;
      }
    },
  });
}
