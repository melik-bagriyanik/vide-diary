import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MANUAL_STATUS_CHECK_DELAY, SEGMENT_END_THRESHOLD, SEGMENT_END_THRESHOLD_BACKUP, VIDEO_ASPECT_RATIO } from '../constants/videoConstants';
import { logger } from '../utils/logger';

interface VideoPlayerProps {
  uri: string;
  onLoad?: (data: { duration: number }) => void;
  onProgress?: (data: { position: number }) => void;
  onError?: (error: string) => void;
  showPlayButton?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export type VideoPlayerRef = {
  setPositionAsync: (position: number) => Promise<void>;
  playAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
};

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ uri, onLoad, onProgress, onError, showPlayButton = false, onPlayStateChange }, ref) => {
    const videoRef = useRef<Video>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLoadedDuration, setHasLoadedDuration] = useState(false);
    const [isReadyForDisplay, setIsReadyForDisplay] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(showPlayButton);

    useEffect(() => {
      if (showPlayButton && !isPlaying) {
        setShowPlayOverlay(true);
      } else if (!showPlayButton) {
        setShowPlayOverlay(false);
      }
    }, [showPlayButton, isPlaying]);

    useImperativeHandle(ref, () => ({
      playAsync: async () => {
        try {
          // Check if we're at the end before playing
          const status = await videoRef.current?.getStatusAsync();
          if (status?.isLoaded && status.durationMillis) {
            const currentPos = status.positionMillis / 1000;
            const duration = status.durationMillis / 1000;
            // If at or near end, don't play (parent should handle reset)
            if (currentPos >= duration - SEGMENT_END_THRESHOLD) {
              return;
            }
          }
          await videoRef.current?.playAsync();
          setIsPlaying(true);
          setShowPlayOverlay(false);
        } catch (e) {
          logger.error('Error in playAsync:', e);
        }
      },
      pauseAsync: async () => {
        try {
          await videoRef.current?.pauseAsync();
          setIsPlaying(false);
          if (showPlayButton) {
            setShowPlayOverlay(true);
          }
        } catch (e) {
          logger.error('Error in pauseAsync:', e);
        }
      },
      setPositionAsync: async (position: number) => {
        try {
          // expo-av uses milliseconds
          await videoRef.current?.setPositionAsync(position * 1000);
        } catch (e: unknown) {
          // "Seeking interrupted" is a common non-critical error when seeking rapidly
          const errorMsg = e instanceof Error ? e.message : String(e);
          if (errorMsg.includes('Seeking interrupted') || errorMsg.includes('interrupted')) {
            // Silent fail - this is expected when seeking rapidly
            return;
          }
          logger.warn('Error in setPositionAsync:', errorMsg);
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
              setIsLoading(false);
              setError(null);
              setHasLoadedDuration(true);
              onLoad?.({ duration: durationSeconds });
            }
          } else if (status?.error) {
            logger.warn('Video loading error:', status.error);
          }
        } catch (e) {
          logger.error('Status check error:', e);
        }
      }, MANUAL_STATUS_CHECK_DELAY);

      return () => clearTimeout(timeout);
    }, [uri, onLoad, hasLoadedDuration]);

    // Handle onLoad - this is called when video metadata is loaded
    const handleLoad = (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        const durationMillis = status.durationMillis;
        if (durationMillis && durationMillis > 0 && durationMillis !== Infinity && !isNaN(durationMillis)) {
          const durationSeconds = durationMillis / 1000;
          setIsLoading(false);
          setError(null);
          setHasLoadedDuration(true);
          onLoad?.({ duration: durationSeconds });
        }
      } else if (status.error) {
        logger.warn('Video load error:', status.error);
      }
    };

    // Handle onReadyForDisplay - this fires even if duration is not available
    const handleReadyForDisplay = () => {
      setIsReadyForDisplay(true);
      
      // If duration hasn't loaded yet, try to get it manually
      if (!hasLoadedDuration && videoRef.current) {
        videoRef.current.getStatusAsync().then((status) => {
          if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
            const durationSeconds = status.durationMillis / 1000;
            setIsLoading(false);
            setError(null);
            setHasLoadedDuration(true);
            onLoad?.({ duration: durationSeconds });
          } else {
            // Even if duration is not available, hide loading (video is ready to display)
            setIsLoading(false);
          }
        }).catch(() => {
          setIsLoading(false);
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

        // Update playing state
        if (status.isPlaying !== isPlaying) {
          const wasPlaying = isPlaying;
          setIsPlaying(status.isPlaying);
          onPlayStateChange?.(status.isPlaying);
          if (status.isPlaying) {
            setShowPlayOverlay(false);
          } else if (showPlayButton && !status.didJustFinish) {
            setShowPlayOverlay(true);
          }
        }
        
        // Check if we need to stop at segment end (for crop screen)
        // This is handled by parent component, but we can also check here
        if (status.isPlaying && status.durationMillis) {
          const currentPos = status.positionMillis / 1000;
          const duration = status.durationMillis / 1000;
          // If very close to end, pause (parent will handle segment logic)
          if (currentPos >= duration - SEGMENT_END_THRESHOLD_BACKUP) {
            // Let parent handle this via onProgress callback
          }
        }

        // Check if we have duration and haven't called onLoad yet
        const durationMillis = status.durationMillis;
        if (!hasLoadedDuration && durationMillis && durationMillis > 0 && durationMillis !== Infinity && !isNaN(durationMillis)) {
          const durationSeconds = durationMillis / 1000;
          setIsLoading(false);
          setError(null);
          setHasLoadedDuration(true);
          onLoad?.({ duration: durationSeconds });
        }
      } else if (status.error) {
        const errorMsg = status.error || 'Playback error';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    };

    const handlePlayPress = async () => {
      if (videoRef.current) {
        try {
          // Get current status to check position
          const status = await videoRef.current.getStatusAsync();
          if (status.isLoaded && status.durationMillis) {
            const currentPos = status.positionMillis / 1000;
            const duration = status.durationMillis / 1000;
            // If we're at or near the end, don't play (let parent handle it)
            // Otherwise just play
            if (currentPos < duration - SEGMENT_END_THRESHOLD) {
              await videoRef.current.playAsync();
              setIsPlaying(true);
              setShowPlayOverlay(false);
            }
          } else {
            await videoRef.current.playAsync();
            setIsPlaying(true);
            setShowPlayOverlay(false);
          }
        } catch (error) {
          logger.error('Error in handlePlayPress:', error);
        }
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
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        {showPlayOverlay && !isLoading && !error && (
          <TouchableOpacity
            style={styles.playButtonOverlay}
            onPress={handlePlayPress}
            activeOpacity={0.8}
          >
            <View style={styles.playButton}>
              <Ionicons name="play" size={48} color="#ffffff" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: VIDEO_ASPECT_RATIO,
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
    aspectRatio: VIDEO_ASPECT_RATIO,
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
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default VideoPlayer;
