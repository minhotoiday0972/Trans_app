import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import { initializeApiUrl, setupUrlListener } from './src/utils/fetchBaseUrl';
import { Alert } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [apiUrl, setApiUrl] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const url = await initializeApiUrl();
        if (url) {
          setApiUrl(url);
        } else {
          Alert.alert('Lỗi', 'Không thể lấy được URL API');
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể khởi tạo ứng dụng: ' + error.message);
      }
    };

    initializeApp();
    const unsubscribe = setupUrlListener((newUrl) => {
      if (newUrl) {
        setApiUrl(newUrl);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!apiUrl) {
    return null; // hoặc hiển thị loading screen
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
