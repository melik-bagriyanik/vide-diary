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

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
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
      let finalUri = uri;

      // Try to trim video (optional - will use original if fails)
      try {
        const trimResult = await trimMutation.mutateAsync({
          uri,
          start: startTime,
          end: endTime,
        });

        if (trimResult.success && trimResult.uri) {
          finalUri = trimResult.uri;
          console.log('✅ Video trimmed successfully');
        } else {
          // Trim failed, use original video
          console.log('⚠️ Video trimming unavailable, using original video');
          finalUri = uri;
        }
      } catch (trimError: any) {
        // Trim failed, use original video
        console.log('⚠️ Video trimming failed, using original video:', trimError?.message);
        finalUri = uri;
      }

      // Save to store (with trimmed URI or original URI)
      const videoId = String(Date.now());
      const videoData = {
        id: videoId,
        name: formData.name,
        description: formData.description,
        uri: finalUri,
        createdAt: Date.now(),
      };

      console.log('💾 Saving video to store:', videoData);

      addVideo(videoData);

      console.log('✅ Video saved successfully, navigating to home...');

      // Small delay to ensure store is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Navigate to home
      router.replace('/(tabs)/');
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Details</Text>
        <View style={styles.headerSpacer} />
      </View>

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
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter description (optional)"
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isProcessing}
              />
            )}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButtonHeader: {
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
