import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import VideoPlayer, { VideoPlayerRef } from '../src/components/VideoPlayer';
import Header from '../src/components/Header';
import TimeDisplay from '../src/components/crop/TimeDisplay';
import VideoScrubber from '../src/components/crop/VideoScrubber';
import LoadingScreen from '../src/components/crop/LoadingScreen';
import ErrorScreen from '../src/components/crop/ErrorScreen';
import { useVideoPersistence } from '../src/hooks/useVideoPersistence';
import AnimatedButton from '../src/components/AnimatedButton';
import { 
  SEGMENT_DURATION, 
  SEGMENT_END_THRESHOLD, 
  SEGMENT_END_THRESHOLD_BACKUP,
  ANIMATION_DURATION,
  ANIMATION_DELAY 
} from '../src/constants/videoConstants';
import { logger } from '../src/utils/logger';

export default function CropScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const originalUri = params.uri as string;
  const videoRef = useRef<VideoPlayerRef>(null);

  const { finalUri, isLoading, error, isCopying } = useVideoPersistence(originalUri);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const maxStartTime = Math.max(0, duration - SEGMENT_DURATION);
  const endTime = Math.min(startTime + SEGMENT_DURATION, duration);

  useEffect(() => {
    if (startTime > maxStartTime) {
      setStartTime(maxStartTime);
    }
  }, [duration, maxStartTime]);

  // Backup check in useEffect (in case progress callback misses it)
  useEffect(() => {
    if (isPlaying && duration > 0 && endTime > 0) {
      if (currentPosition >= endTime - SEGMENT_END_THRESHOLD_BACKUP) {
        const pauseVideo = async () => {
          if (videoRef.current && isPlaying) {
            try {
              await videoRef.current.pauseAsync();
              setIsPlaying(false);
              const finalPosition = Math.min(currentPosition, endTime);
              await videoRef.current.setPositionAsync(finalPosition);
              setCurrentPosition(finalPosition);
            } catch (error) {
              logger.error('Error pausing video at segment end (useEffect):', error);
              setIsPlaying(false);
            }
          }
        };
        pauseVideo();
      }
    }
  }, [currentPosition, isPlaying, endTime, duration]);

  const handleLoad = (data: { duration: number }) => {
    if (data.duration > 0) {
      setDuration(data.duration);
    }
  };

  const handleVideoError = (errorMsg: string) => {
    logger.error('Video error in crop screen:', errorMsg);
  };

  const handleProgress = (data: { position: number }) => {
    const newPosition = data.position;
    setCurrentPosition(newPosition);
    
    // Check if we've reached the end of segment while playing
    // Do this directly in progress callback for more reliable stopping
    if (isPlaying && duration > 0 && endTime > 0) {
      if (newPosition >= endTime - SEGMENT_END_THRESHOLD) {
        const pauseVideo = async () => {
          if (videoRef.current) {
            try {
              await videoRef.current.pauseAsync();
              setIsPlaying(false);
              const finalPosition = Math.min(newPosition, endTime);
              await videoRef.current.setPositionAsync(finalPosition);
              setCurrentPosition(finalPosition);
            } catch (error) {
              logger.error('Error pausing video at segment end:', error);
              setIsPlaying(false);
            }
          }
        };
        pauseVideo();
      }
    }
  };

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    // If video is starting to play and we're at the end of segment, reset to startTime
    if (playing && Math.abs(currentPosition - endTime) < 0.1) {
      if (videoRef.current) {
        videoRef.current.setPositionAsync(startTime);
        setCurrentPosition(startTime);
      }
    }
  };

  const handleSliderChange = async (value: number) => {
    const clampedValue = Math.min(value, maxStartTime);
    setStartTime(clampedValue);
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(clampedValue);
    }
  };

  const handleProceed = () => {
    router.push({
      pathname: '/metadata',
      params: {
        uri: finalUri || originalUri,
        startTime: startTime.toString(),
        endTime: endTime.toString(),
      },
    });
  };

  if (isCopying) {
    return <LoadingScreen message="Preparing video..." />;
  }

  if (isLoading && !error && finalUri) {
    return <LoadingScreen message="Loading video..." uri={finalUri} />;
  }

  if (error || !finalUri) {
    return (
      <ErrorScreen
        title="⚠️ Error Loading Video"
        message={error || 'No video URI provided'}
        originalUri={originalUri}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Select Segment" />

      <Animated.View 
        entering={FadeIn.duration(ANIMATION_DURATION.SLOW)} 
        style={styles.videoContainer}
      >
        <VideoPlayer
          ref={videoRef}
          uri={finalUri}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onError={handleVideoError}
          showPlayButton={true}
          onPlayStateChange={handlePlayStateChange}
        />
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(ANIMATION_DELAY.MEDIUM).duration(ANIMATION_DURATION.SLOW)} 
        style={styles.timeContainer}
      >
        <TimeDisplay startTime={startTime} endTime={endTime} segmentDuration={SEGMENT_DURATION} />

        <VideoScrubber
          duration={duration}
          startTime={startTime}
          segmentDuration={SEGMENT_DURATION}
          maxStartTime={maxStartTime}
          currentPosition={currentPosition}
          isPlaying={isPlaying}
          onValueChange={handleSliderChange}
        />
      </Animated.View>

      <View style={styles.actionButtonContainer}>
        <AnimatedButton
          variant="primary"
          size="large"
          onPress={handleProceed}
          disabled={duration === 0}
        >
          <Text style={styles.proceedButtonText}>Continue to Metadata →</Text>
        </AnimatedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  videoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  actionButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});