import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTrimVideo } from '../src/hooks/useTrimVideo';
import { useVideoStore } from '../src/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';
import Header from '../src/components/Header';

const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .refine((val) => val.length > 0, 'Name cannot be empty'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform((val) => (val?.trim() === '' ? undefined : val?.trim())),
});

type FormData = z.infer<typeof schema>;

export default function MetadataScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const uri = params.uri as string;
  const startTime = parseFloat(params.startTime as string) || 0;
  const endTime = parseFloat(params.endTime as string) || 0;

  const trimMutation = useTrimVideo();
  const addVideo = useVideoStore((state) => state.addVideo);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (formData: FormData) => {
    if (!uri) {
      Alert.alert('Error', 'Video URI is missing. Please go back and select a video.');
      return;
    }

    try {
      // Try to trim video - REQUIRED for 5-second segment
      let finalUri: string | null = null;

      try {
        const trimResult = await trimMutation.mutateAsync({
          uri,
          start: startTime,
          end: endTime,
        });

        if (trimResult.success && trimResult.uri) {
          finalUri = trimResult.uri;
          console.log('✅ Video trimmed successfully to 5 seconds');
        } else {
          // Trim failed - show error and don't save
          const errorMessage = trimResult.error || 'Video trimming failed';
          console.warn('⚠️ Video trimming unavailable:', errorMessage);
          
          // Check if it's a development build issue
          const isDevelopmentBuildError = errorMessage.includes('development build') || 
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
            Alert.alert(
              'Trimming Failed',
              'Failed to create a 5-second video segment.\n\n' +
              'Error: ' + errorMessage + '\n\n' +
              'Please try again or use a development build.',
              [{ text: 'OK' }]
            );
          }
          return; // Don't save the video
        }
      } catch (trimError: any) {
        // Trim failed - show error and don't save
        console.error('❌ Video trimming error:', trimError);
        
        Alert.alert(
          'Trimming Required',
          'Video trimming is required to create a 5-second segment. ' +
          'This feature requires a development build. ' +
          'Error: ' + (trimError?.message || 'Unknown error'),
          [{ text: 'OK' }]
        );
        return; // Don't save the video
      }

      if (!finalUri) {
        Alert.alert('Error', 'Failed to create trimmed video. Please try again.');
        return;
      }

      // Save to store (only trimmed 5-second video)
      const videoId = String(Date.now());
      const videoData = {
        id: videoId,
        name: formData.name,
        description: formData.description,
        uri: finalUri,
        createdAt: Date.now(),
      };

      console.log('💾 Saving trimmed 5-second video to database:', videoData);

      await addVideo(videoData);

      console.log('✅ Video saved successfully, navigating to home...');

      // Navigate to home (main screen - back button disabled)
      router.replace('/');
    } catch (error: any) {
      console.error('❌ Error saving video:', error);
      Alert.alert(
        'Error',
        error?.message || 'Error saving video. Please try again.'
      );
    }
  };

  const isProcessing = trimMutation.isPending;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Header title="Add Details" />

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Name <Text style={styles.requiredIndicator}>*</Text>
          </Text>
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                placeholder="Enter video name"
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isProcessing}
                maxLength={100}
              />
            )}
          />
          {errors.name && (
            <Text style={styles.errorMessage}>{errors.name.message}</Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <Controller
            name="description"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.textInput, styles.textArea, errors.description && styles.inputError]}
                placeholder="Enter description (optional)"
                placeholderTextColor="#9ca3af"
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isProcessing}
                maxLength={500}
              />
            )}
          />
          {errors.description && (
            <Text style={styles.errorMessage}>{errors.description.message}</Text>
          )}
        </View>

        {/* Video Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Segment Info</Text>
            <Text style={styles.infoText}>
              Selected: {Math.round(endTime - startTime)} seconds
            </Text>
            <Text style={styles.infoSubtext}>
              Note: If trimming is unavailable, the full video will be saved.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isProcessing}
          style={[styles.saveButton, isProcessing && styles.buttonDisabled]}
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
        </TouchableOpacity>
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
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredIndicator: {
    color: '#ef4444',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
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
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1e3a8a',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#1e3a8a',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginTop: 'auto',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
