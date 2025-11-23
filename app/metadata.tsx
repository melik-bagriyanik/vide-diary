import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useVideoStore } from '../src/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';
import Header from '../src/components/Header';
import MetadataForm from '../src/components/metadata/MetadataForm';
import SegmentInfo from '../src/components/metadata/SegmentInfo';
import { useVideoProcessing } from '../src/hooks/useVideoProcessing';
import { metadataSchema, type MetadataFormData } from '../src/schemas/metadataSchema';
import AnimatedButton from '../src/components/AnimatedButton';

export default function MetadataScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const uri = params.uri as string;
  const startTime = parseFloat(params.startTime as string) || 0;
  const endTime = parseFloat(params.endTime as string) || 0;

  const { processVideo, isProcessing } = useVideoProcessing();
  const addVideo = useVideoStore((state) => state.addVideo);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MetadataFormData>({
    resolver: zodResolver(metadataSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (formData: MetadataFormData) => {
    if (!uri) {
      Alert.alert('Error', 'Video URI is missing. Please go back and select a video.');
      return;
    }

    try {
      const { finalUri, thumbnailUri } = await processVideo(uri, startTime, endTime);

      if (!finalUri) {
        Alert.alert('Error', 'Failed to process video. Please try again.');
        return;
      }

      const videoId = String(Date.now());
      const videoData = {
        id: videoId,
        name: formData.name,
        description: formData.description,
        uri: finalUri,
        thumbnailUri,
        createdAt: Date.now(),
      };

      await addVideo(videoData);
      router.replace('/');
    } catch (error: any) {
      console.error('❌ Error saving video:', error);
      
      const errorMessage = error?.message || 'Error saving video. Please try again.';
      const isDevelopmentBuildError =
        errorMessage.includes('development build') ||
        errorMessage.includes('native module') ||
        errorMessage.includes('ExpoTrimVideo');

      if (isDevelopmentBuildError) {
        Alert.alert(
          'Development Build Required',
          'This app requires video trimming to create 5-second segments.\n\n' +
            'Video trimming only works in development builds, not in Expo Go.\n\n' +
            'To use this app:\n' +
            '1. Stop Expo Go\n' +
            '2. Run: npx expo run:ios (for iOS)\n' +
            '   Or: npx expo run:android (for Android)\n' +
            '3. Wait for the build to complete\n' +
            '4. The app will open automatically\n\n' +
            'Note: First build may take 5-10 minutes.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Add Details" />

      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)} 
        style={styles.formContainer}
      >
        <MetadataForm control={control} errors={errors} disabled={isProcessing} />
        <SegmentInfo duration={Math.round(endTime - startTime)} />
      </Animated.View>

      <View style={styles.actionButtonContainer}>
        <AnimatedButton
          variant="primary"
          size="large"
          onPress={handleSubmit(onSubmit)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.saveButtonText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Video</Text>
            </>
          )}
        </AnimatedButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  actionButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginTop: 'auto',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});