import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import { initializeApiUrl, setupUrlListener } from './src/utils/fetchBaseUrl';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from './src/utils/colors';

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#f4511e" />
    <Text style={styles.loadingText}>Đang kết nối với máy chủ...</Text>
  </View>
);

function App() {
  const [apiUrl, setApiUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const initializeApp = async () => {
    try {
      const url = await initializeApiUrl();
      if (url) {
        console.log('App initialized with URL:', url);
        setApiUrl(url);
        setError(null);
        setRetryCount(0); // Reset retryCount khi thành công
      } else {
        setError('Không thể lấy được URL API');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      setError('Không thể khởi tạo ứng dụng: ' + error.message);
      setIsLoading(false);
    }
  };

  // Hàm thử lại kết nối
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    initializeApp();
  };

  useEffect(() => {
    let isMounted = true;
    
    // Khởi tạo ứng dụng
    initializeApp();

    // Lắng nghe thay đổi URL từ Firebase
    const unsubscribe = setupUrlListener((newUrl) => {
      if (isMounted && newUrl) {
        console.log('URL updated in App:', newUrl);
        setApiUrl(newUrl);
        setRetryCount(0); // Reset retryCount khi URL cập nhật thành công
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Lỗi kết nối</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>Vui lòng kiểm tra kết nối mạng và thử lại</Text>
        
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
        
        {retryCount > 0 && (
          <Text style={styles.retryCount}>
            Đã thử lại {retryCount} lần
          </Text>
        )}
      </View>
    );
  }

  if (!apiUrl) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={(props) => <HomeScreen {...props} apiUrl={apiUrl} />}
          options={{
            title: 'TransApp',
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export { App };

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorHint: {
    color: colors.textLightGray,
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textDark,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.errorRed,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textGray,
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    elevation: 3,
    paddingHorizontal: 30,
    paddingVertical: 12,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryCount: {
    color: colors.textLighterGray,
    fontSize: 14,
    marginTop: 15,
  },
});