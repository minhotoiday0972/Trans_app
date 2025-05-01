import React from 'react';
import { Button, Alert } from 'react-native';
import { Audio } from 'expo-av';

export function AudioPlayer({ url }) {
  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phát âm thanh: ' + error.message);
    }
  };

  return <Button title="Phát Âm Thanh" onPress={playSound} />;
};