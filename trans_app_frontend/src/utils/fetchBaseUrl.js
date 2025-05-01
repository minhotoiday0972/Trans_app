import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue, get } from 'firebase/database';
import db from '../../firebase'; // Đảm bảo đường dẫn đúng
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
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
};

const isUrlResponding = async (url, timeout = 10000) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}ping/`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(id);
    return response.ok;
  } catch (error) {
    console.warn('URL connectivity check failed:', error.message);
    return false;
  }
};

export const getApiUrl = () => currentUrl;

const fetchFirebaseUrl = async () => {
  try {
    const urlRef = ref(db, 'api_url'); // Sửa thành api_url
    const snapshot = await get(urlRef);
    const url = snapshot.val();
    
    if (url && isValidUrl(url)) {
      const isWorking = await isUrlResponding(url);
      if (isWorking) {
        console.log('Firebase URL hoạt động bình thường:', url);
      } else {
        console.warn('Firebase URL không phản hồi:', url);
      }
      return url;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Firebase URL:', error);
    return null;
  }
};

export const initializeApiUrl = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isValidUrl(stored)) {
      const isWorking = await isUrlResponding(stored);
      if (isWorking) {
        currentUrl = stored;
        console.log('Đã lấy URL từ AsyncStorage (hoạt động tốt):', currentUrl);
        return currentUrl;
      } else {
        console.warn('URL trong AsyncStorage không hoạt động, thử phương pháp khác');
      }
    }

    const firebaseUrl = await withRetry(fetchFirebaseUrl, 2, 1500);
    if (firebaseUrl) {
      currentUrl = firebaseUrl;
      await AsyncStorage.setItem(STORAGE_KEY, firebaseUrl);
      console.log('Đã lấy URL từ Firebase (get):', currentUrl);
      return currentUrl;
    }

    return new Promise((resolve, reject) => {
      const urlRef = ref(db, 'api_url'); // Sửa thành api_url
      let isResolved = false;
      
      const unsubscribe = onValue(urlRef, async (snapshot) => {
        if (isResolved) return;
        
        const url = snapshot.val();
        if (url && isValidUrl(url)) {
          const isWorking = await isUrlResponding(url);
          
          isResolved = true;
          currentUrl = url;
          await AsyncStorage.setItem(STORAGE_KEY, url);
          unsubscribe();
          
          if (isWorking) {
            console.log('Đã lấy URL từ Firebase (listener, hoạt động tốt):', currentUrl);
          } else {
            console.warn('Đã lấy URL từ Firebase (listener, không phản hồi):', currentUrl);
          }
          
          resolve(url);
        } else if (!isResolved) {
          isResolved = true;
          unsubscribe();
          reject(new Error('Không tìm thấy URL hợp lệ trên Firebase'));
        }
      }, (error) => {
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      });

      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          unsubscribe();
          reject(new Error('Timeout khi lấy URL từ Firebase'));
        }
      }, 8000);
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
  const urlRef = ref(db, 'api_url'); // Sửa thành api_url
  const unsubscribe = onValue(urlRef, async (snapshot) => {
    const newUrl = snapshot.val();
    if (newUrl && isValidUrl(newUrl) && newUrl !== currentUrl) {
      const isWorking = await isUrlResponding(newUrl);
      
      if (await setApiUrl(newUrl)) {
        if (isWorking) {
          console.log('URL đã được cập nhật từ Firebase (hoạt động tốt):', newUrl);
        } else {
          console.warn('URL đã được cập nhật từ Firebase (không phản hồi):', newUrl);
        }
        onUrlChange?.(newUrl);
      }
    }
  }, (error) => {
    console.error('Firebase listener error:', error);
    Alert.alert('Lỗi', 'Không thể lắng nghe thay đổi URL: ' + error.message);
  });
  return unsubscribe;
};