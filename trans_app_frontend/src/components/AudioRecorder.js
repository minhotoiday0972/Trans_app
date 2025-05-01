import React, { useState, useEffect } from 'react';
import { Button, Alert} from 'react-native';
import { Audio } from 'expo-av';

export function AudioRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  // Kiểm tra và yêu cầu quyền
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Yêu cầu quyền ghi âm
        const { status } = await Audio.requestPermissionsAsync();
        console.log('Audio permission status:', status);
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền thu âm để sử dụng tính năng này');
          setHasAudioPermission(false);
          return;
        }

        // Thiết lập audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        console.log('Audio mode set successfully');

        setHasAudioPermission(true);
      } catch (error) {
        console.error('Error requesting permissions:', error.message);
        Alert.alert('Lỗi', 'Không thể yêu cầu quyền: ' + error.message);
        setHasAudioPermission(false);
      }
    };

    requestPermissions();
  }, []);

  const startRecording = async () => {
    if (!hasAudioPermission) {
      Alert.alert('Lỗi', 'Không có quyền thu âm');
      return;
    }

    try {
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_WAV,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      await newRecording.startAsync();
      setRecording(newRecording);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error.message);
      Alert.alert('Lỗi', 'Không thể bắt đầu thu âm: ' + error.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Audio URI:', uri);
      const info = await recording.getStatusAsync();
      console.log('Recording info:', info);
      setRecording(null);
      onRecordingComplete(uri);
    } catch (error) {
      console.error('Error stopping recording:', error.message);
      Alert.alert('Lỗi', 'Không thể dừng thu âm: ' + error.message);
    }
  };

  return (
    <>
      {recording ? (
        <Button title="Dừng Thu Âm" onPress={stopRecording} />
      ) : (
        <Button title="Bắt Đầu Thu Âm" onPress={startRecording} />
      )}
    </>
  );
};