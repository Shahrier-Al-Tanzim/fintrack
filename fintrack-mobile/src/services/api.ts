import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use localhost for local development, Render for production
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://fintrack-v6l3.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor: This runs automatically before EVERY request you make
api.interceptors.request.use(
  async (config) => {
    try {
      // Look for the token in the browser's secure local storage
      const token = await AsyncStorage.getItem('userToken');

      // If we are logged in, attach the token to the headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;