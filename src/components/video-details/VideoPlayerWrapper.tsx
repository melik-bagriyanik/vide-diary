import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerWrapperProps {
  uri: string | null;
}

export default function VideoPlayerWrapper({ uri }: VideoPlayerWrapperProps) {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);

  useEffect(() => {
    if (uri && isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [uri, isLoading]);

  const handlePlayPress = async () => {
    if (videoRef.current) {
      await videoRef.current.playAsync();
      setIsPlaying(true);
      setShowPlayOverlay(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.isPlaying !== isPlaying) {
        setIsPlaying(status.isPlaying);
        if (status.isPlaying) {
          setShowPlayOverlay(false);
        } else if (!status.didJustFinish) {
          setShowPlayOverlay(true);
        }
      }
    }
  };

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
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
      {showPlayOverlay && !isLoading && (
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
