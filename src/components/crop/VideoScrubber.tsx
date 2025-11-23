import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { formatTime } from '../../utils/dateUtils';

interface VideoScrubberProps {
  duration: number;
  startTime: number;
  segmentDuration: number;
  maxStartTime: number;
  currentPosition?: number;
  isPlaying?: boolean;
  onValueChange: (value: number) => void;
}

export default function VideoScrubber({
  duration,
  startTime,
  segmentDuration,
  maxStartTime,
  currentPosition = 0,
  isPlaying = false,
  onValueChange,
}: VideoScrubberProps) {
  const segmentStartPercentage = duration > 0 ? (startTime / duration) * 100 : 0;
  const segmentWidthPercentage = duration > 0 ? (segmentDuration / duration) * 100 : 0;
  const endTime = Math.min(startTime + segmentDuration, duration);
  
  // Calculate current position indicator within segment
  // Round to 0.1s for smoother updates
  const roundedCurrentPosition = Math.round(currentPosition * 10) / 10;
  const currentPositionInSegment = Math.max(startTime, Math.min(roundedCurrentPosition, endTime));
  const currentPositionPercentage = duration > 0 ? (currentPositionInSegment / duration) * 100 : 0;
  const positionInSegmentPercentage = currentPositionInSegment > startTime 
    ? ((currentPositionInSegment - startTime) / segmentDuration) * 100 
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.sliderWrapper}>
        {duration > 0 && (
          <View style={styles.sliderTrackBackground} pointerEvents="none">
            {segmentStartPercentage > 0 && (
              <View
                style={[
                  styles.sliderTrackSegment,
                  styles.sliderTrackUnselected,
                  { width: `${segmentStartPercentage}%` },
                ]}
              />
            )}
            <View
              style={[
                styles.sliderTrackSegment,
                styles.sliderTrackSelected,
                { width: `${segmentWidthPercentage}%` },
              ]}
            >
              {/* Current position indicator when playing */}
              {isPlaying && currentPositionInSegment >= startTime && currentPositionInSegment <= endTime && (
                <View
                  style={[
                    styles.currentPositionIndicator,
                    { left: `${positionInSegmentPercentage}%` },
                  ]}
                />
              )}
            </View>
            {(segmentStartPercentage + segmentWidthPercentage) < 100 && (
              <View
                style={[
                  styles.sliderTrackSegment,
                  styles.sliderTrackUnselected,
                  { width: `${100 - (segmentStartPercentage + segmentWidthPercentage)}%` },
                ]}
              />
            )}
          </View>
        )}
        <View style={[styles.sliderContainer, { opacity: 1 }]}>
          <View style={{ opacity: 1 }}>
            <Slider
              minimumValue={0}
              maximumValue={duration}
              value={isPlaying ? currentPositionInSegment : startTime}
              onValueChange={(value) => {
                if (!isPlaying) {
                  const clampedValue = Math.min(value, maxStartTime);
                  onValueChange(clampedValue);
                }
              }}
              minimumTrackTintColor="transparent"
              maximumTrackTintColor="transparent"
              thumbTintColor="#000000"
              step={0.1}
              disabled={isPlaying}
            />
          </View>
        </View>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>{formatTime(0)}</Text>
        <View style={styles.sliderSelectedRange}>
          <Text style={styles.sliderSelectedRangeText}>
            {formatTime(startTime)} - {formatTime(endTime)}
          </Text>
        </View>
        <Text style={styles.sliderLabelText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sliderWrapper: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  sliderContainer: {
    opacity: 1, // Always keep slider fully opaque
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 6,
    flexDirection: 'row',
    top: '50%',
    marginTop: -3,
    zIndex: 0,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderTrackSegment: {
    height: '100%',
  },
  sliderTrackSelected: {
    backgroundColor: '#3b82f6',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: '#2563eb',
    borderRightColor: '#2563eb',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderTrackUnselected: {
    backgroundColor: '#e5e7eb',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sliderSelectedRange: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  sliderSelectedRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  currentPositionIndicator: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 14,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
