import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { loginSuccess } from '../redux/authSlice'; // Adjust path as needed

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  // REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhPjGiav5ghkYWM_5XG9NT39e1l3Zd5s0CjoNWg_54717tMd0DfY9Mbwd6PLwF4ZUS/exec"; 

  const handleLogin = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid Input", "PIN must be at least 4 digits");
      return;
    }

    setLoading(true);

    try {
      // Sending POST request to Google Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', pin: pin }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // 1. Save user to Redux (Redux Persist handles storage)
        dispatch(loginSuccess({ name: result.user }));
        
        // 2. Navigate to your main app
        router.replace('/(drawer)/home'); 
      } else {
        Alert.alert("Access Denied", "Incorrect PIN");
        setPin(''); // Clear the PIN
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter Access PIN</Text>
      
      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry={true}
        placeholder="••••••"
        placeholderTextColor="#ccc"
      />

      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>LOGIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  pinInput: {
    width: '80%',
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 30,
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 30,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#007AFF', // Change this to your brand color
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});