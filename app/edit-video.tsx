import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVideoStore } from '../src/store/useVideoStore';
import { Ionicons } from '@expo/vector-icons';
import Header from '../src/components/Header';
import MetadataForm from '../src/components/metadata/MetadataForm';
import { metadataSchema, type MetadataFormData } from '../src/schemas/metadataSchema';

type FormData = MetadataFormData;

export default function EditVideoScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const videoId = params.id as string;
  const video = useVideoStore((state) => state.videos.find((v) => v.id === videoId));
  const updateVideo = useVideoStore((state) => state.updateVideo);
  const [isSaving, setIsSaving] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      name: video?.name || '',
      description: video?.description || '',
    },
  });

  const onSubmit = async (formData: FormData) => {
    if (!video) {
      Alert.alert('Error', 'Video not found.');
      return;
    }

    try {
      setIsSaving(true);
      await updateVideo(videoId, {
        name: formData.name,
        description: formData.description,
      });

      Alert.alert('Success', 'Video updated successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('❌ Error updating video:', error);
      Alert.alert('Error', error?.message || 'Failed to update video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!video) {
    return (
      <View style={styles.container}>
        <Header title="Edit Video" />
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Video Not Found</Text>
          <Text style={styles.emptyMessage}>
            The video you are trying to edit does not exist or has been deleted.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Edit Video" />

      <View style={styles.formContainer}>
        <MetadataForm control={control} errors={errors} disabled={isSaving} />
      </View>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
        >
          {isSaving ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  actionButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginTop: 'auto',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
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

