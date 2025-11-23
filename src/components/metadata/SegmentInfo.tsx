import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SegmentInfoProps {
  duration: number;
}

export default function SegmentInfo({ duration }: SegmentInfoProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="information-circle" size={20} color="#2563eb" />
      <View style={styles.content}>
        <Text style={styles.title}>Segment Info</Text>
        <Text style={styles.text}>Selected: {Math.round(duration)} seconds</Text>
        <Text style={styles.subtext}>
          Note: If trimming is unavailable, the full video will be saved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: '#1e3a8a',
  },
  subtext: {
    fontSize: 12,
    color: '#1e3a8a',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
