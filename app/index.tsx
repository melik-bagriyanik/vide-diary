import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text>SevenApps Video Diary</Text>
      <Link href="/crop">Go to Crop</Link>
    </View>
  );
}

