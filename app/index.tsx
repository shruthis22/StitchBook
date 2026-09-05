import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';





export default function Index() {


  const router = useRouter();
  
  // Select auth state from Redux
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  useEffect(() => {
    // Add a small delay or check immediately
    if (isAuthenticated) {
      router.replace('/(drawer)/home');
    } else {
      router.replace('/Login');
    }
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}