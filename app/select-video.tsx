import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Button, View } from 'react-native';

export default function SelectVideo() {
  const router = useRouter();

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
 
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Button title="Select Video" onPress={pickVideo} />
    </View>
  );
}

