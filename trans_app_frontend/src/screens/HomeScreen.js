// HomeScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Button, ActivityIndicator, SafeAreaView } from 'react-native';
import AudioRecorder from '../components/AudioRecorder';
import TextInputBox from '../components/TextInputBox';
import AudioPlayer from '../components/AudioPlayer';
import api from '../api/api';
import * as FileSystem from 'expo-file-system';
import { initializeApiUrl, setApiUrl } from '../utils/fetchBaseUrl';
import { colors } from '../utils/colors';

const HomeScreen = ({ apiUrl }) => {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [speechUrl, setSpeechUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!apiUrl && !error) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6f61" />
        <Text>Đang kết nối với server...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Thử lại" onPress={() => initializeApiUrl().then(setApiUrl).catch(setError)} />
      </View>
    );
  }

  const checkNetwork = async () => {
    try {
      const response = await fetch(`${apiUrl}ping/`, { method: 'GET' });
      return response.ok;
    } catch (error) {
      console.error('Check network error:', error);
      return false;
    }
  };

  const handleRecordingComplete = async (uri) => {
    setIsLoading(true);
    try {
      const newUri = `${FileSystem.documentDirectory}audio.wav`;
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      const isNetworkAvailable = await checkNetwork();
      if (!isNetworkAvailable) {
        throw new Error('Không có kết nối mạng');
      }

      const transcription = await api.transcribeAudio(newUri, apiUrl);
      setInputText(transcription);

      await FileSystem.deleteAsync(newUri);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phiên âm: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateAndSpeak = async () => {
    if (!inputText) {
      Alert.alert('Lỗi', 'Vui lòng nhập hoặc thu âm văn bản');
      return;
    }
    setIsLoading(true);
    try {
      const isNetworkAvailable = await checkNetwork();
      if (!isNetworkAvailable) {
        throw new Error('Không có kết nối mạng');
      }
      const translation = await api.translateText(inputText, apiUrl);
      setTranslation(translation);
      const url = await api.textToSpeech(translation, apiUrl);
      setSpeechUrl(url);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể dịch hoặc tạo âm thanh: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerText}>TransApp</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phiên âm và Dịch</Text>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          <TextInputBox
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập văn bản hoặc thu âm"
            style={styles.input}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Dịch và Đọc"
              onPress={handleTranslateAndSpeak}
              color="#ff6f61"
              disabled={isLoading}
            />
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ff6f61" style={styles.loading} />
          ) : (
            translation && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Bản dịch:</Text>
                <Text style={styles.resultText}>{translation}</Text>
              </View>
            )
          )}
          {speechUrl && <AudioPlayer url={speechUrl} />}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 20,
    padding: 20,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  container: {
    backgroundColor: colors.backgroundWhite,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.errorRed,
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  headerText: {
    color: colors.textDark,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderColor: colors.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
  },
  loading: {
    marginVertical: 15,
  },
  resultContainer: {
    backgroundColor: colors.backgroundLighter,
    borderRadius: 8,
    marginVertical: 15,
    padding: 10,
  },
  resultLabel: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  resultText: {
    color: colors.textDark,
    fontSize: 16,
  },
  safeArea: {
    backgroundColor: colors.backgroundLight,
    flex: 1,
  },
});

export { HomeScreen };