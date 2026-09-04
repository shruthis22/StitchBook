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

  const handleLogin = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid Input", "Password must be at least 4 characters");
      return;
    }

    setLoading(true);

    try {
      // Basic mock login for MVP
      dispatch(loginSuccess({ name: "Boutique Owner" }));
      router.replace('/(drawer)/dashboard');
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
        source={require("../assets/company-logo.jpg")}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.logoText}>StitchBook</Text>
      <Text style={styles.header}>Welcome Back</Text>

      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={setPin}
        secureTextEntry={true}
        placeholder="Enter Password"
        placeholderTextColor="#999"
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
    backgroundColor: '#FAF9F6', // Off-white/cream for boutique feel
    padding: 20,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: -10,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#4A3B32', // Dark brownish
    marginBottom: 10,
  },
  header: {
    fontSize: 16,
    color: '#6B5B52',
    marginBottom: 40,
    letterSpacing: 1,
  },
  pinInput: {
    width: '80%',
    height: 60,
    borderWidth: 1,
    borderColor: '#E6E2DD',
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    color: '#333',
  },
  loginButton: {
    width: '80%',
    height: 55,
    backgroundColor: '#4A3B32', // Premium boutique color
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
