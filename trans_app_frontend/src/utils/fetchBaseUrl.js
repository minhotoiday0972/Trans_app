import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue } from 'firebase/database';
import db from '../../firebase';
import { Alert } from 'react-native';

const STORAGE_KEY = '@api_url';
let currentUrl = null;

const withRetry = async (fn, maxRetries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getApiUrl = () => currentUrl;

export const initializeApiUrl = async () => {
  try {
    // Thử lấy từ AsyncStorage trước
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isValidUrl(stored)) {
      currentUrl = stored;
      return currentUrl;
    }

    // Nếu không có trong AsyncStorage, đợi lấy từ Firebase
    return new Promise((resolve, reject) => {
      const urlRef = ref(db, 'config/apiUrl');
      const unsubscribe = onValue(urlRef, async (snapshot) => {
        const url = snapshot.val();
        if (url && isValidUrl(url)) {
          currentUrl = url;
          await AsyncStorage.setItem(STORAGE_KEY, url);
          unsubscribe(); // Ngắt listener sau khi lấy được URL
          resolve(url);
        } else {
          reject(new Error('URL không hợp lệ từ Firebase'));
        }
      }, (error) => {
        reject(error);
      });

      // Timeout sau 10 giây nếu không lấy được URL
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout khi lấy URL từ Firebase'));
      }, 10000);
    });
  } catch (error) {
    console.error('Error in initializeApiUrl:', error);
    throw error;
  }
};

export const setApiUrl = async (newUrl) => {
  if (isValidUrl(newUrl)) {
    currentUrl = newUrl;
    await AsyncStorage.setItem(STORAGE_KEY, newUrl);
    return true;
  }
  return false;
};

export const setupUrlListener = (onUrlChange) => {
  const urlRef = ref(db, 'config/apiUrl');
  const unsubscribe = onValue(urlRef, async (snapshot) => {
    const newUrl = snapshot.val();
    if (newUrl && isValidUrl(newUrl)) {
      if (await setApiUrl(newUrl)) {
        onUrlChange?.(newUrl);
      }
    }
  }, (error) => {
    console.error('Firebase listener error:', error);
    Alert.alert('Lỗi', 'Không thể lắng nghe thay đổi URL: ' + error.message);
  });
  return unsubscribe;
};