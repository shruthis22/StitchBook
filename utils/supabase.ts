
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Install this package: npm install react-native-url-polyfill
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // Keeps the user logged in
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});