import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVideoStore } from '@/src/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import Header from '@/src/components/Header';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VideoDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const videoId = params.id as string;
  const video = useVideoStore((state) => state.videos.find((v) => v.id === videoId));
  const removeVideo = useVideoStore((state) => state.removeVideo);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const videoRef = React.useRef<Video>(null);

  // Fix video URI - resolve absolute paths to current document directory
  useEffect(() => {
    if (video?.uri) {
      const fixVideoUri = async () => {
        let uri = video.uri;
        console.log('🔍 Checking video URI:', uri);
        
        // Remove file:// prefix if present for checking
        const uriForCheck = uri.replace(/^file:\/\//, '');
        
        // Step 1: Try the URI as-is first (might already be correct)
        try {
          const directInfo = await FileSystem.getInfoAsync(uri);
          if (directInfo.exists && !directInfo.isDirectory) {
            console.log('✅ Video exists at stored URI:', uri);
            setVideoUri(uri);
            return;
          }
        } catch (e) {
          console.log('⚠️ Direct URI check failed:', e);
        }
        
        // Step 1b: Try with file:// prefix added if missing
        if (!uri.startsWith('file://') && !uri.startsWith('http')) {
          try {
            const uriWithPrefix = `file://${uri}`;
            const directInfo2 = await FileSystem.getInfoAsync(uriWithPrefix);
            if (directInfo2.exists && !directInfo2.isDirectory) {
              console.log('✅ Video exists with file:// prefix:', uriWithPrefix);
              setVideoUri(uriWithPrefix);
              return;
            }
          } catch (e) {
            console.log('⚠️ File:// prefix check failed:', e);
          }
        }
        
        // Step 2: If it's an absolute path, try to find it in current document directory
        const isAbsolutePath = uriForCheck.startsWith('/Users/') || 
                               uriForCheck.startsWith('/var/') || 
                               uri.includes('/Documents/trimmed_videos/') ||
                               uri.includes('trimmed_videos/');
        
        if (isAbsolutePath) {
          console.log('⚠️ Absolute path detected, trying to locate in current directory...');
          
          // Extract filename from path
          const fileName = uriForCheck.split('/').pop() || uri.split('/').pop() || `video_${Date.now()}.mp4`;
          console.log('🔍 Extracted filename:', fileName);
          
          // Try trimmed_videos directory (where we save them)
          const trimmedDir = `${FileSystem.documentDirectory}trimmed_videos/`;
          const trimmedPath = `${trimmedDir}${fileName}`;
          
          try {
            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(trimmedDir);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(trimmedDir, { intermediates: true });
            }
            
            // Check if file exists
            const trimmedInfo = await FileSystem.getInfoAsync(trimmedPath);
            if (trimmedInfo.exists && !trimmedInfo.isDirectory) {
              console.log('✅ Found video in trimmed_videos:', trimmedPath);
              setVideoUri(trimmedPath);
              return;
            }
          } catch (e) {
            console.log('⚠️ Error checking trimmed_videos:', e);
          }
          
          // Step 3: Try to list all files in trimmed_videos and find by filename
          try {
            const trimmedDir = `${FileSystem.documentDirectory}trimmed_videos/`;
            const dirInfo = await FileSystem.getInfoAsync(trimmedDir);
            if (dirInfo.exists && dirInfo.isDirectory) {
              const files = await FileSystem.readDirectoryAsync(trimmedDir);
              console.log('🔍 Files in trimmed_videos:', files);
              
              // Try to find exact match or similar
              const matchingFile = files.find(f => f === fileName || f.includes(fileName.split('.')[0]));
              if (matchingFile) {
                const foundPath = `${trimmedDir}${matchingFile}`;
                console.log('✅ Found matching file:', foundPath);
                setVideoUri(foundPath);
                return;
              }
              
              // Last resort: use most recent file if any exist
              if (files.length > 0) {
                const mostRecentFile = files.sort().reverse()[0];
                const fallbackPath = `${trimmedDir}${mostRecentFile}`;
                console.log('⚠️ Using most recent file as fallback:', fallbackPath);
                setVideoUri(fallbackPath);
                return;
              }
            }
          } catch (e) {
            console.log('⚠️ Error listing trimmed_videos directory:', e);
          }
          
          // Step 4: Try document directory root
          try {
            const docPath = `${FileSystem.documentDirectory}${fileName}`;
            const docInfo = await FileSystem.getInfoAsync(docPath);
            if (docInfo.exists && !docInfo.isDirectory) {
              console.log('✅ Found video in document directory:', docPath);
              setVideoUri(docPath);
              return;
            }
          } catch (e) {
            console.log('⚠️ Error checking document directory:', e);
          }
          
          // If we get here, file was not found
          console.error('❌ Video file not found anywhere');
          console.error('❌ Original URI:', uri);
          console.error('❌ Extracted filename:', fileName);
          console.error('❌ Current document directory:', FileSystem.documentDirectory);
          console.error('❌ Tried paths:');
          console.error('   - Direct:', uri);
          console.error('   - With file://:', uri.startsWith('file://') ? 'already had prefix' : `file://${uri}`);
          console.error('   - Trimmed videos:', `${FileSystem.documentDirectory}trimmed_videos/${fileName}`);
          console.error('   - Document root:', `${FileSystem.documentDirectory}${fileName}`);
          
          // Show user-friendly error
          Alert.alert(
            'Video Not Found',
            'The video file could not be found. It may have been deleted or moved.\n\nPlease try adding the video again.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
          
          setIsLoading(false);
          setVideoUri(null);
        } else {
          // Relative path, cache directory, HTTP, or other format
          try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
              console.log('✅ Video file exists:', uri);
              setVideoUri(uri);
            } else {
              // Might be HTTP or other format - try as is
              console.log('⚠️ File check failed, using URI as-is (might be HTTP/other):', uri);
              setVideoUri(uri);
            }
          } catch (error) {
            // If getInfoAsync fails, try using the URI as is (might be HTTP or other format)
            console.log('⚠️ Could not check file, using URI as is:', uri);
            setVideoUri(uri);
          }
        }
      };
      
      fixVideoUri();
    } else {
      setIsLoading(false);
      setVideoUri(null);
    }
  }, [video?.uri]);

  // Timeout fallback - eğer video 5 saniye içinde yüklenmezse loading'i kaldır
  useEffect(() => {
    if (video && isLoading && videoUri) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Video loading timeout, hiding loading overlay');
        setIsLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [video, isLoading, videoUri]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete "${video?.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (video) {
              setIsDeleting(true);
              await removeVideo(video.id);
              // Small delay for smooth transition
              await new Promise((resolve) => setTimeout(resolve, 300));
              // Go to home (main screen - back button disabled)
              router.replace('/');
            }
          },
        },
      ]
    );
  };

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
      {/* Header */}
      <Header title="Video Details" />

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        {videoUri ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            onLoad={(status: AVPlaybackStatus) => {
              console.log('📌 Video onLoad fired:', status);
              if (status.isLoaded) {
                setIsLoading(false);
              }
            }}
            onReadyForDisplay={() => {
              console.log('📌 Video onReadyForDisplay fired');
              setIsLoading(false);
            }}
            onError={(error) => {
              console.error('Video error:', error);
              setIsLoading(false);
            }}
          />
        ) : (
          <View style={styles.videoPlayer}>
            <Text style={styles.errorText}>Video file not found</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.videoName}>{video.name}</Text>
          <View style={styles.metadataRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.videoDate}>{formatDate(video.createdAt)}</Text>
          </View>
        </View>

        {video.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.videoDescription}>{video.description}</Text>
          </View>
        )}

        {/* Edit Button */}
        <TouchableOpacity
          onPress={() => router.push(`/edit-video?id=${video.id}`)}
          style={styles.editButton}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#2563eb" />
          <Text style={styles.editButtonText}>Edit Video</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
              <Text style={styles.deleteButtonText}>Delete Video</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
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
  detailsContainer: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  videoName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  descriptionSection: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
