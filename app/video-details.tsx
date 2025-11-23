import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVideoStore } from '@/src/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/src/components/Header';
import VideoPlayerWrapper from '@/src/components/video-details/VideoPlayerWrapper';
import VideoDetailsInfo from '@/src/components/video-details/VideoDetailsInfo';
import { useVideoUriFix } from '@/src/hooks/useVideoUriFix';

export default function VideoDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const videoId = params.id as string;
  const video = useVideoStore((state) => state.videos.find((v) => v.id === videoId));
  const removeVideo = useVideoStore((state) => state.removeVideo);
  const [isDeleting, setIsDeleting] = useState(false);

  const { fixedUri } = useVideoUriFix(video?.uri);

  const handleDelete = () => {
    if (!video) return;

    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            // Navigate immediately to prevent "not found" flash
            router.replace('/');
            // Remove video in background after navigation
            try {
              await removeVideo(video.id);
            } catch (error) {
              console.error('Error deleting video:', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/edit-video?id=${videoId}`);
  };

  // Show loading state if deleting to prevent "not found" flash
  if (isDeleting) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="trash-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Deleting...</Text>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Video Not Found</Text>
        <Text style={styles.emptyMessage}>
          The video you are looking for does not exist or has been deleted.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Video Details" />

      <View style={styles.videoContainer}>
        <VideoPlayerWrapper uri={fixedUri} />
      </View>

      <VideoDetailsInfo
        video={video}
        isDeleting={isDeleting}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
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