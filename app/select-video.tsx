import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../src/components/AnimatedButton';
import Header from '../src/components/Header';

const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';

export default function SelectVideoScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'photo' | 'document' | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to select videos.',
        [{ text: 'OK' }]
      );
      return false;
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
    <View style={styles.container}>
      {/* Header */}
      <Header title="Select Video" />

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)} 
          style={styles.iconContainer}
        >
          <Ionicons name="videocam" size={64} color="#2563eb" />
        </Animated.View>

        <Animated.Text 
          entering={FadeInDown.delay(200).duration(400)} 
          style={styles.title}
        >
          Choose Your Video
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(400)} 
          style={styles.subtitle}
        >
          Select a video from your photo library or files to create a 5-second diary entry
        </Animated.Text>

        {/* Primary Action - Photo Library */}
        <AnimatedButton
          variant="primary"
          size="large"
          entering={FadeInUp.delay(400).duration(400)}
          onPress={pickVideoFromPhotos}
          disabled={isLoading}
          style={styles.primaryButton}
        >
          {isLoading && loadingType === 'photo' ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.primaryButtonText}>Loading...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="images" size={24} color="#ffffff" />
              <Text style={styles.primaryButtonText}>
                {Platform.OS === 'ios' ? 'Choose from Photos' : 'Choose from Gallery'}
              </Text>
            </>
          )}
        </AnimatedButton>

        {/* Secondary Action - File Picker */}
        <AnimatedButton
          variant="secondary"
          size="large"
          entering={FadeInUp.delay(500).duration(400)}
          onPress={pickVideoFromFiles}
          disabled={isLoading}
          style={styles.secondaryButton}
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
        </AnimatedButton>

        {/* Info Box */}
        <Animated.View 
          entering={FadeInUp.delay(700).duration(400)} 
          style={styles.infoBox}
        >
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>💡 How to Add Videos</Text>
            {Platform.OS === 'ios' ? (
              <Text style={styles.infoText}>
                Adding videos to the iOS Simulator:{'\n'}
                1. Simply drag and drop any video file from your computer directly onto the simulator window.{'\n'}
                2. The simulator will automatically save it to the Photos app.{'\n'}
                3. Then tap "Choose from Photos" button.
              </Text>
            ) : (
              <Text style={styles.infoText}>
                Adding videos to the Android Emulator:{'\n'}
                1. Open Gallery app in the emulator{'\n'}
                2. Use the emulator's extended controls to add media files{'\n'}
                3. Or use "Choose Video File" to select from device storage.
              </Text>
            )}
          </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
