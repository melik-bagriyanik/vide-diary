import React, { useState, useCallback } from 'react';
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
import { formatRelativeDate } from '@/src/utils/dateUtils';

export default function VideoListScreen() {
  const router = useRouter();
  const videos = useVideoStore((state) => state.videos);
  const [refreshing, setRefreshing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for store hydration
  React.useEffect(() => {
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
        {item.thumbnailUri ? (
          <Image
            source={{ uri: item.thumbnailUri }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
            placeholderContentFit="cover"
            onError={(error) => {
              logger.warn('Thumbnail load error for video:', item.id, error);
            }}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="videocam-outline" size={24} color="#9ca3af" />
            <Text style={styles.thumbnailPlaceholderText}>No thumbnail</Text>
          </View>
        )}
        <View style={styles.playButtonOverlay}>
          <Ionicons name="play-circle" size={32} color="rgba(255, 255, 255, 0.9)" />
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
        ) : null}
        <View style={styles.metadataRow}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.videoDate}>{formatRelativeDate(item.createdAt)}</Text>
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
        <Ionicons name="videocam-outline" size={64} color="#d1d5db" />
      </View>
      <Text style={styles.emptyTitle}>No videos yet</Text>
      <Text style={styles.emptySubtitle}>
        Start by selecting a video and creating your first diary entry
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => router.push('/select-video')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={20} color="#ffffff" />
        <Text style={styles.addFirstButtonText}>Add Your First Video</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>📹 Video Diary</Text>
        <Text style={styles.headerSubtitle}>
          {videos.length} {videos.length === 1 ? 'video' : 'videos'} saved
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/select-video')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#2563eb" />
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 120,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  thumbnailPlaceholderText: {
    marginTop: 4,
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  videoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 6,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 24,
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
