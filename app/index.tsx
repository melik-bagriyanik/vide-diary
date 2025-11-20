import { Link } from 'expo-router';
import { View } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-white px-6">
 
      <View className="w-full gap-3">
        <Link
          href="/select-video"
          className="rounded-xl bg-blue-600 py-4 text-center text-lg font-semibold text-white"
        >
          Pick a Video
        </Link>

      </View>
    </View>
  );
}

