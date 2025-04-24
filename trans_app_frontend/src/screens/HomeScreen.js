import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Button, ActivityIndicator, SafeAreaView } from 'react-native';
import AudioRecorder from '../components/AudioRecorder';
import TextInputBox from '../components/TextInputBox';
import AudioPlayer from '../components/AudioPlayer';
import { transcribeAudio, translateText, textToSpeech } from '../api/api';
import * as FileSystem from 'expo-file-system';

const HomeScreen = ({ apiUrl }) => {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [speechUrl, setSpeechUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!apiUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6f61" />
        <Text>Đang kết nối với server...</Text>
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

      const transcription = await transcribeAudio(newUri, apiUrl); // Thêm apiUrl
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
      const translation = await translateText(inputText, apiUrl); // Thêm apiUrl
      setTranslation(translation);
      const url = await textToSpeech(translation, apiUrl); // Thêm apiUrl
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
        {/* Header */}
        <Text style={styles.headerText}>TransApp</Text>

        {/* Main Content */}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loading: {
    marginVertical: 15,
  },
  resultContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
});

export default HomeScreen;