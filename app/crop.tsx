import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import VideoPlayer, { VideoPlayerRef } from '../src/components/VideoPlayer';
import Header from '../src/components/Header';
import TimeDisplay from '../src/components/crop/TimeDisplay';
import VideoScrubber from '../src/components/crop/VideoScrubber';
import LoadingScreen from '../src/components/crop/LoadingScreen';
import ErrorScreen from '../src/components/crop/ErrorScreen';
import { useVideoPersistence } from '../src/hooks/useVideoPersistence';

const SEGMENT_DURATION = 5; // 5 seconds fixed

export default function CropScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const originalUri = params.uri as string;
  const videoRef = useRef<VideoPlayerRef>(null);

  const { finalUri, isLoading, error, isCopying } = useVideoPersistence(originalUri);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const maxStartTime = Math.max(0, duration - SEGMENT_DURATION);
  const endTime = Math.min(startTime + SEGMENT_DURATION, duration);

  useEffect(() => {
    if (startTime > maxStartTime) {
      setStartTime(maxStartTime);
    }
  }, [duration, maxStartTime]);

  const handleLoad = (data: { duration: number }) => {
    if (data.duration > 0) {
      setDuration(data.duration);
    }
  };

  const handleVideoError = (errorMsg: string) => {
    console.error('❌ Video error in crop screen:', errorMsg);
  };

  const handleProgress = (data: { position: number }) => {
    setCurrentPosition(data.position);
  };

  const handleSliderChange = async (value: number) => {
    const clampedValue = Math.min(value, maxStartTime);
    setStartTime(clampedValue);
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(clampedValue);
    }
  };

  const handlePreview = async () => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(startTime);
      await videoRef.current.playAsync();
      setTimeout(async () => {
        if (videoRef.current) {
          await videoRef.current.pauseAsync();
        }
      }, SEGMENT_DURATION * 1000);
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

      <View style={styles.videoContainer}>
        <VideoPlayer
          ref={videoRef}
          uri={finalUri}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onError={handleVideoError}
        />
      </View>

      <View style={styles.timeContainer}>
        <TimeDisplay startTime={startTime} endTime={endTime} segmentDuration={SEGMENT_DURATION} />

        <VideoScrubber
          duration={duration}
          startTime={startTime}
          segmentDuration={SEGMENT_DURATION}
          maxStartTime={maxStartTime}
          onValueChange={handleSliderChange}
        />

        <TouchableOpacity onPress={handlePreview} style={styles.previewButton}>
          <Text style={styles.previewButtonText}>▶ Preview Segment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          onPress={handleProceed}
          style={[styles.proceedButton, duration === 0 && styles.buttonDisabled]}
          disabled={duration === 0}
        >
          <Text style={styles.proceedButtonText}>Continue to Metadata →</Text>
        </TouchableOpacity>
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
  previewButton: {
    marginTop: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  proceedButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
});