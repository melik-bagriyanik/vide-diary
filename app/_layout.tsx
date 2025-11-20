import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { queryClient } from '../src/lib/queryClient';

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
