import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoStore } from '@/src/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const videos = useVideoStore((state) => state.videos);
  const [refreshing, setRefreshing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for store hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const renderVideoItem = ({ item }: { item: typeof videos[0] }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => router.push(`/video-details?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          placeholderContentFit="cover"
        />
        <View style={styles.playButtonOverlay}>
          <Ionicons name="play-circle" size={40} color="rgba(255, 255, 255, 0.95)" />
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color="#ffffff" />
          <Text style={styles.durationText}>5s</Text>
        </View>
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.videoDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : (
          <Text style={styles.videoDescriptionPlaceholder}>No description</Text>
        )}
        <View style={styles.metadataRow}>
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.videoDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="videocam-outline" size={80} color="#d1d5db" />
      </View>
      <Text style={styles.emptyTitle}>No videos yet</Text>
      <Text style={styles.emptySubtitle}>
        Start by importing a video and creating your first diary entry
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => router.push('/select-video')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={22} color="#ffffff" />
        <Text style={styles.addFirstButtonText}>Import Your First Video</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>📹 Video Diary</Text>
        <Text style={styles.headerSubtitle}>
          {videos.length} {videos.length === 1 ? 'video' : 'videos'} saved
        </Text>
      </View>
      <TouchableOpacity
        style={styles.importButton}
        onPress={() => router.push('/select-video')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.importButtonText}>Import Video</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={videos.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 140,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  videoName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  videoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  videoDescriptionPlaceholder: {
    fontSize: 13,
    color: '#d1d5db',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chevronContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
