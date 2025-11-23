import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface VideoPlayerWrapperProps {
  uri: string | null;
}

export default function VideoPlayerWrapper({ uri }: VideoPlayerWrapperProps) {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (uri && isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [uri, isLoading]);

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Video file not found</Text>
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
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        onLoad={(status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            setIsLoading(false);
          }
        }}
        onReadyForDisplay={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setIsLoading(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ffffff',
  },
});
