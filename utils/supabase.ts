
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; 
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://agvonmsatzxbgsdzolpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndm9ubXNhdHp4YmdzZHpvbHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQzNDYsImV4cCI6MjA3OTM3MDM0Nn0.n3GJyHBnIlq4KyJDXfQHcZ6NXHRrUhF0jXFgnvw3xS4';



// This tells Supabase how to talk to Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});