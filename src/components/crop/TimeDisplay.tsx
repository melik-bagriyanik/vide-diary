import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/dateUtils';

interface TimeDisplayProps {
  startTime: number;
  endTime: number;
  segmentDuration: number;
}

export default function TimeDisplay({ startTime, endTime, segmentDuration }: TimeDisplayProps) {
  return (
    <View style={styles.timeRow}>
      <View style={styles.timeItem}>
        <Text style={styles.timeLabel}>Start</Text>
        <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
      </View>
      <View style={styles.timeItem}>
        <Text style={styles.timeLabel}>End</Text>
        <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
      </View>
      <View style={styles.timeItem}>
        <Text style={styles.timeLabel}>Duration</Text>
        <Text style={[styles.timeValue, styles.durationValue]}>{formatTime(segmentDuration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  durationValue: {
    color: '#2563eb',
  },
});
