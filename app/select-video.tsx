import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';

export default function SelectVideoScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'photo' | 'document' | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select videos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const pickVideoFromPhotos = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      setLoadingType('photo');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (result.canceled) {
        setIsLoading(false);
        setLoadingType(null);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          router.push({
            pathname: '/crop',
            params: { uri: asset.uri },
          });
        }
      }

      setIsLoading(false);
      setLoadingType(null);
    } catch (error: any) {
      setIsLoading(false);
      setLoadingType(null);
      console.error('Error picking video from photos:', error);
      Alert.alert('Error', error?.message || 'Failed to select video from photos.');
    }
  };

  const pickVideoFromFiles = async () => {
    try {
      setIsLoading(true);
      setLoadingType('document');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        setLoadingType(null);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          router.push({
            pathname: '/crop',
            params: { uri: asset.uri },
          });
        }
      }

      setIsLoading(false);
      setLoadingType(null);
    } catch (error: any) {
      setIsLoading(false);
      setLoadingType(null);
      console.error('Error picking video from files:', error);
      Alert.alert('Error', error?.message || 'Failed to select video from files.');
    }
  };

  const useTestVideo = () => {
    router.push({
      pathname: '/crop',
      params: { uri: TEST_VIDEO_URL },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Video</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="videocam" size={64} color="#2563eb" />
        </View>

        <Text style={styles.title}>Choose Your Video</Text>
        <Text style={styles.subtitle}>
          Select a video from your photo library or files to create a 5-second diary entry
        </Text>

        {/* Primary Action - Photo Library (iOS) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && loadingType === 'photo' && styles.buttonDisabled]}
            onPress={pickVideoFromPhotos}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading && loadingType === 'photo' ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.primaryButtonText}>Loading...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="images" size={24} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Choose from Photos</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Secondary Action - File Picker */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            isLoading && loadingType === 'document' && styles.buttonDisabled,
          ]}
          onPress={pickVideoFromFiles}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading && loadingType === 'document' ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.secondaryButtonText}>Loading...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="folder" size={20} color="#2563eb" />
              <Text style={styles.secondaryButtonText}>
                {Platform.OS === 'ios' ? 'Choose from Files' : 'Choose Video File'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Test Video Option */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={useTestVideo}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={20} color="#6b7280" />
          <Text style={styles.testButtonText}>Use Test Video</Text>
          <Text style={styles.testButtonSubtext}>(For Testing)</Text>
        </TouchableOpacity>

        {/* Info Box */}
        {Platform.OS === 'ios' && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>💡 Simulator Tip</Text>
              <Text style={styles.infoText}>
                To add videos to the simulator:{'\n'}
                1. Go to Device → Photos → Add Photos{'\n'}
                2. Or download a video in Safari and save to Photos{'\n'}
                3. Then use "Choose from Photos" above
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#2563eb',
    marginBottom: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  testButton: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  testButtonSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  infoBox: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 20,
  },
});
