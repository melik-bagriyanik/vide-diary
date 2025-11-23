import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/dateUtils';

interface VideoDetailsInfoProps {
  video: {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
  };
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VideoDetailsInfo({
  video,
  isDeleting,
  onEdit,
  onDelete,
}: VideoDetailsInfoProps) {
  return (
    <View style={styles.container}>
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

      <TouchableOpacity onPress={onEdit} style={styles.editButton} activeOpacity={0.8}>
        <Ionicons name="create-outline" size={20} color="#2563eb" />
        <Text style={styles.editButtonText}>Edit Video</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDelete}
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
  );
}

const styles = StyleSheet.create({
  container: {
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
});
