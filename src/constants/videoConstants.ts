/**
 * Application-wide constants
 */

// Video segment duration (in seconds)
export const SEGMENT_DURATION = 5;

// Video processing constants
export const VIDEO_MAX_DURATION = 300; // 5 minutes in seconds
export const VIDEO_QUALITY = 1; // Maximum quality

// Position update thresholds (in seconds)
export const POSITION_UPDATE_THRESHOLD = 0.1;
export const POSITION_ROUNDING_PRECISION = 0.1;

// Segment end detection thresholds (in seconds)
export const SEGMENT_END_THRESHOLD = 0.1;
export const SEGMENT_END_THRESHOLD_BACKUP = 0.15;

// Video player constants
export const VIDEO_ASPECT_RATIO = 16 / 9;
export const MANUAL_STATUS_CHECK_DELAY = 1500; // milliseconds

// File system constants
export const TRIMMED_VIDEOS_DIR = 'trimmed_videos/';

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 400,
} as const;

// Animation delays (in milliseconds)
export const ANIMATION_DELAY = {
  SHORT: 100,
  MEDIUM: 200,
  LONG: 300,
} as const;

// Database
export const DATABASE_NAME = 'video-diary.db';

// Error messages
export const ERROR_MESSAGES = {
  VIDEO_NOT_FOUND: 'Video file not found',
  VIDEO_LOADING_FAILED: 'Failed to load video',
  VIDEO_PROCESSING_FAILED: 'Failed to process video',
  VIDEO_SAVING_FAILED: 'Failed to save video',
  VIDEO_DELETING_FAILED: 'Failed to delete video',
  VIDEO_UPDATING_FAILED: 'Failed to update video',
  PERMISSION_REQUIRED: 'Permission required',
  INVALID_VIDEO_URI: 'Invalid video URI',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  VIDEO_SAVED: 'Video saved successfully',
  VIDEO_UPDATED: 'Video updated successfully',
  VIDEO_DELETED: 'Video deleted successfully',
} as const;

