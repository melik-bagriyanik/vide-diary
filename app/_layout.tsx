import { Stack } from "expo-router";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

export default function Layout() {
  useEffect(() => {
    // Suppress expo-trim-video native module errors in Expo Go
    LogBox.ignoreLogs([
      'Cannot find native module',
      'ExpoTrimVideo',
      'expo-trim-video',
      'Cannot find native module \'ExpoTrimVideo\'',
    ]);
    
    // Also ignore errors in console
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        (message.includes('Cannot find native module') &&
          message.includes('ExpoTrimVideo')) ||
        message.includes('Seeking interrupted') ||
        message.includes('Error in setPositionAsync')
      ) {
        // Suppress these specific errors
        return;
      }
      originalError.apply(console, args);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false, // Disable default header for all screens
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            gestureEnabled: false, // Disable swipe back gesture on iOS
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
