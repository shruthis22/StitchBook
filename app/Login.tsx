import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/authSlice'; // Adjust path as needed

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  // REPLACE THIS WITH YOUR NEW DEPLOYED GOOGLE APPS SCRIPT URL
  const handleLogin = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid Input", "PIN must be at least 4 digits");
      return;
    }

    setLoading(true);

    try {
      // Bypassing the server-side PIN check to log in locally
      dispatch(loginSuccess({ name: "Car Point Admin" }));
      router.replace('/(drawer)/home');
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
      />
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
    backgroundColor: '#000000',
    padding: 20,
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#FFFFFF',
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
    backgroundColor: '#B78165', // Change this to your brand color
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