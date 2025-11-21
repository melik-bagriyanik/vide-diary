import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import VideoPlayer, { VideoPlayerRef } from '../src/components/VideoPlayer';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function CropScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const originalUri = params.uri as string;
  const videoRef = useRef<VideoPlayerRef>(null);

  const [finalUri, setFinalUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Copy video to app cache to prevent Android URI deletion issue
  useEffect(() => {
    async function persistVideo() {
      if (!originalUri) {
        setError('No video URI provided');
        setIsLoading(false);
        return;
      }

      console.log('✂️ Crop Screen Original URI =>', originalUri);
      console.log('✂️ URI Format =>', {
        isFile: originalUri?.startsWith('file://'),
        isContent: originalUri?.startsWith('content://'),
        isHttp: originalUri?.startsWith('http'),
        isPh: originalUri?.startsWith('ph://'),
        firstChars: originalUri?.substring(0, 30),
      });

      // For HTTP URLs, use directly
      if (originalUri.startsWith('http')) {
        console.log('✅ Using HTTP URL directly');
        setFinalUri(originalUri);
        setIsLoading(false);
        return;
      }

      // For local files, copy to app cache to prevent deletion
      try {
        setIsCopying(true);
        const fileName = originalUri.split('/').pop() || 'video.mp4';
        const cacheUri = `${FileSystem.cacheDirectory}persistent_${Date.now()}_${fileName}`;
        
        console.log('📦 Copying video to cache:', cacheUri);
        await FileSystem.copyAsync({
          from: originalUri,
          to: cacheUri,
        });

        console.log('✅ Video copied to cache successfully');
        setFinalUri(cacheUri);
        setIsCopying(false);
        setIsLoading(false);
      } catch (copyError: any) {
        console.error('❌ Error copying video to cache:', copyError);
        // Fallback: try using original URI
        console.log('⚠️ Falling back to original URI');
        setFinalUri(originalUri);
        setIsCopying(false);
        setIsLoading(false);
      }
    }

    persistVideo();
  }, [originalUri]);

  const segmentDuration = 5; // 5 seconds fixed
  const maxStartTime = Math.max(0, duration - segmentDuration);
  const endTime = Math.min(startTime + segmentDuration, duration);

  useEffect(() => {
    if (startTime > maxStartTime) {
      setStartTime(maxStartTime);
    }
  }, [duration, maxStartTime]);

  const handleLoad = (data: { duration: number }) => {
    if (data.duration > 0) {
      console.log('✅ Video loaded in crop screen, duration:', data.duration);
      setDuration(data.duration);
      setIsLoading(false);
      setError(null);
    } else {
      console.warn('⚠️ handleLoad called but duration is 0 or invalid');
    }
  };

  const handleVideoError = (errorMsg: string) => {
    console.error('❌ Video error in crop screen:', errorMsg);
    setError(errorMsg);
    setIsLoading(false);
  };

  const handleProgress = (data: { position: number }) => {
    setCurrentPosition(data.position);
  };

  const handleSliderChange = async (value: number) => {
    const clampedValue = Math.min(value, maxStartTime);
    setStartTime(clampedValue);

    // Update video position
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(clampedValue);
    }
  };

  const handlePreview = async () => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(startTime);
      await videoRef.current.playAsync();
      // Stop after 5 seconds
      setTimeout(async () => {
        if (videoRef.current) {
          await videoRef.current.pauseAsync();
        }
      }, segmentDuration * 1000);
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
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Preparing video...</Text>
      </View>
    );
  }

  if (isLoading && !error && finalUri) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading video...</Text>
        {finalUri && (
          <Text style={styles.loadingUri} numberOfLines={1}>
            URI: {finalUri.length > 50 ? finalUri.substring(0, 50) + '...' : finalUri}
          </Text>
        )}
      </View>
    );
  }

  if (error || !finalUri) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>⚠️ Error Loading Video</Text>
        <Text style={styles.errorMessage}>{error || 'No video URI provided'}</Text>
        {originalUri && (
          <Text style={styles.errorUri} numberOfLines={2}>
            Original URI: {originalUri}
          </Text>
        )}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Segment</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <VideoPlayer
          ref={videoRef}
          uri={finalUri}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onError={handleVideoError}
        />
      </View>

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Duration</Text>
            <Text style={[styles.timeValue, styles.durationValue]}>
              {formatTime(segmentDuration)}
            </Text>
          </View>
        </View>

        {/* Scrubber */}
        <View style={styles.sliderContainer}>
          <Slider
            minimumValue={0}
            maximumValue={Math.max(0, duration - segmentDuration)}
            value={startTime}
            onValueChange={handleSliderChange}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#3b82f6"
            step={0.1}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>{formatTime(0)}</Text>
            <Text style={styles.sliderLabelText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Preview Button */}
        <TouchableOpacity onPress={handlePreview} style={styles.previewButton}>
          <Text style={styles.previewButtonText}>▶ Preview Segment</Text>
        </TouchableOpacity>
      </View>

      {/* Action Button */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButtonHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 60,
  },
  videoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timeContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  durationValue: {
    color: '#2563eb',
  },
  sliderContainer: {
    marginTop: 16,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9ca3af',
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingUri: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorUri: {
    fontSize: 12,
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
