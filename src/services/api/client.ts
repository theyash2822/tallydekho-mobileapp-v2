import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants';

// Android emulator → 10.0.2.2 to reach Mac localhost
// iOS simulator → localhost
// Physical device → Mac's actual IP
const getBaseURL = () => {
  if (__DEV__) {
    // 10.0.2.2 = Android emulator reaches Mac
    // 192.168.29.241 = physical Android phone on same WiFi
    if (Platform.OS === 'android') return 'http://192.168.29.241:3001/app';
    return 'http://localhost:3001/app';
  }
  return 'https://api.tallydekho.com/app';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Standardize error responses
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
