import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  onLoad?: (data: { duration: number }) => void;
  onProgress?: (data: { position: number }) => void;
  onError?: (error: string) => void;
}

export type VideoPlayerRef = {
  setPositionAsync: (position: number) => Promise<void>;
  playAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
};

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ uri, onLoad, onProgress, onError }, ref) => {
    const videoRef = useRef<Video>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLoadedDuration, setHasLoadedDuration] = useState(false);
    const [isReadyForDisplay, setIsReadyForDisplay] = useState(false);

    console.log('🎬🎬🎬 VideoPlayer component RENDERED, URI:', uri);
    console.log('🎬 URI Format Check =>', {
      isFile: uri?.startsWith('file://'),
      isContent: uri?.startsWith('content://'),
      isHttp: uri?.startsWith('http'),
      isPh: uri?.startsWith('ph://'),
      length: uri?.length,
    });

    useImperativeHandle(ref, () => ({
      playAsync: async () => {
        console.log('▶️ playAsync called');
        try {
          await videoRef.current?.playAsync();
        } catch (e) {
          console.error('❌ Error in playAsync:', e);
        }
      },
      pauseAsync: async () => {
        console.log('⏸️ pauseAsync called');
        try {
          await videoRef.current?.pauseAsync();
        } catch (e) {
          console.error('❌ Error in pauseAsync:', e);
        }
      },
            setPositionAsync: async (position: number) => {
              console.log('⏩ setPositionAsync called with:', position, 'seconds');
              try {
                // expo-av uses milliseconds
                await videoRef.current?.setPositionAsync(position * 1000);
              } catch (e: any) {
                // "Seeking interrupted" is a common non-critical error when seeking rapidly
                const errorMsg = e?.message || String(e) || '';
                if (errorMsg.includes('Seeking interrupted') || errorMsg.includes('interrupted')) {
                  // Silent fail - this is expected when seeking rapidly
                  return;
                }
                console.warn('⚠️ Error in setPositionAsync:', errorMsg);
              }
            },
    }));

    // Manual status check after 1.5 seconds (fallback if onLoad doesn't fire)
    useEffect(() => {
      if (!videoRef.current || !uri) return;
      
      // Skip manual check if video is already loaded
      if (hasLoadedDuration) return;

      const timeout = setTimeout(async () => {
        try {
          const status = await videoRef.current?.getStatusAsync();
          
          if (status?.isLoaded) {
            const durationMillis = status.durationMillis;
            
            if (durationMillis && durationMillis > 0 && durationMillis !== Infinity && !isNaN(durationMillis)) {
              const durationSeconds = durationMillis / 1000;
              console.log('✅✅✅ Video loaded via manual status check, duration:', durationSeconds, 'seconds');
              setIsLoading(false);
              setError(null);
              setHasLoadedDuration(true);
              onLoad?.({ duration: durationSeconds });
            } else {
              // Duration not available but video is loaded - might still be loading metadata
              console.log('📌 Manual status check: video is loaded but duration not available yet');
            }
          } else {
            // Video not loaded yet - only warn if there's an actual error
            if (status?.error) {
              console.warn('⚠️ Manual status check: video loading error:', status.error);
            } else {
              // No error, just not loaded yet - this is normal, don't warn
              console.log('📌 Manual status check: video still loading...');
            }
          }
        } catch (e) {
          console.error('⛔ Status Error:', e);
        }
      }, 1500);

      return () => clearTimeout(timeout);
    }, [uri, onLoad, hasLoadedDuration]);

    // Handle onLoad - this is called when video metadata is loaded
    const handleLoad = (status: AVPlaybackStatus) => {
      console.log('📌📌📌 onLoad fired with status:', JSON.stringify(status, null, 2));
      if (status.isLoaded) {
        const durationMillis = status.durationMillis;
        console.log('✅ onLoad - durationMillis:', durationMillis);
        if (durationMillis && durationMillis > 0 && durationMillis !== Infinity && !isNaN(durationMillis)) {
          const durationSeconds = durationMillis / 1000;
          console.log('✅✅✅ Video loaded via onLoad, duration:', durationSeconds, 'seconds');
          setIsLoading(false);
          setError(null);
          setHasLoadedDuration(true);
          onLoad?.({ duration: durationSeconds });
        } else {
          console.warn('⚠️ onLoad fired but durationMillis is invalid:', durationMillis);
        }
      } else {
        console.warn('⚠️ onLoad fired but status is not loaded, error:', status.error);
      }
    };

    // Handle onReadyForDisplay - this fires even if duration is not available
    const handleReadyForDisplay = () => {
      console.log('📌📌📌 onReadyForDisplay fired!');
      setIsReadyForDisplay(true);
      
      // If duration hasn't loaded yet, try to get it manually
      if (!hasLoadedDuration && videoRef.current) {
        videoRef.current.getStatusAsync().then((status) => {
          console.log('📌 onReadyForDisplay - checking status:', JSON.stringify(status, null, 2));
          if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
            const durationSeconds = status.durationMillis / 1000;
            console.log('✅ Video loaded via onReadyForDisplay status check, duration:', durationSeconds, 'seconds');
            setIsLoading(false);
            setError(null);
            setHasLoadedDuration(true);
            onLoad?.({ duration: durationSeconds });
          } else {
            // Even if duration is not available, hide loading (video is ready to display)
            console.log('⚠️ onReadyForDisplay: duration not available, but video is ready');
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    };

    // Handle playback status updates - this is called continuously during playback
    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        // Update progress
        const positionSeconds = status.positionMillis / 1000;
        onProgress?.({ position: positionSeconds });

        // Check if we have duration and haven't called onLoad yet
        const durationMillis = status.durationMillis;
        if (!hasLoadedDuration && durationMillis && durationMillis > 0 && durationMillis !== Infinity && !isNaN(durationMillis)) {
          const durationSeconds = durationMillis / 1000;
          console.log('✅✅✅ Video loaded via onPlaybackStatusUpdate, duration:', durationSeconds, 'seconds');
          setIsLoading(false);
          setError(null);
          setHasLoadedDuration(true);
          onLoad?.({ duration: durationSeconds });
        }
      } else if (status.error) {
        console.error('❌ Playback error:', status.error);
        const errorMsg = status.error || 'Playback error';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    };

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          {uri && (
            <Text style={styles.errorUri} numberOfLines={2}>
              {uri.startsWith('http') ? 'URL: ' : 'URI: '}
              {uri.length > 60 ? uri.substring(0, 60) + '...' : uri}
            </Text>
          )}
        </View>
      );
    }

    if (!uri) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ No video URI provided</Text>
        </View>
      );
    }

    console.log('🎬 Rendering Video component with URI:', uri);

    return (
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.videoView}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          onLoad={handleLoad}
          onReadyForDisplay={handleReadyForDisplay}
          onError={(errorMsg: string) => {
            console.error('🔥🔥🔥 VIDEO ERROR:', errorMsg);
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      </View>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  errorUri: {
    color: '#991b1b',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VideoPlayer;
