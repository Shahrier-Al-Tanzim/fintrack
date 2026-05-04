import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { setCredentials } from '../stores/authSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

// This tells TypeScript what screens we can navigate to from here
type AuthNavigationProp = NativeStackNavigationProp<any, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation<AuthNavigationProp>();

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      dispatch(setCredentials({ user, token }));
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Please check your connection.';
      setError(msg);
      if (err.response?.data?.details) {
        // If there are specific validation issues, show the first one
        setError(`${msg}: ${err.response.data.details[0].message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FinTrack</Text>
      <Text style={styles.subtitle}>Welcome Back</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={(text) => { setEmail(text); setError(null); }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={(text) => { setPassword(text); setError(null); }}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#1E1E1E' },
  title: { fontSize: 42, fontWeight: 'bold', color: '#FF3366', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#888', textAlign: 'center', marginBottom: 40 },
  errorContainer: { backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: 15, borderRadius: 10, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14, fontWeight: '500' },
  input: { backgroundColor: '#2C2C2E', color: '#FFF', borderRadius: 12, padding: 18, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: 'rgba(244, 67, 54, 0.5)' },
  button: { backgroundColor: '#FF3366', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 5, shadowColor: '#FF3366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#888', textAlign: 'center', marginTop: 25, fontSize: 16 },
});