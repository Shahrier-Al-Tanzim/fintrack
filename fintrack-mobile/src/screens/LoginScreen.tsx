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
  const dispatch = useDispatch();
  const navigation = useNavigation<AuthNavigationProp>();

  const handleLogin = async () => {
    console.log('1. Login button pressed!');
    console.log('Email:', email, 'Password:', password);

    if (!email || !password) {
      console.log('2. Stopped: Missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      console.log('3. Sending request to backend...');
      // 1. Send the data to your Node.js backend
      const response = await api.post('/auth/login', { email, password });
      
      console.log('4. Backend success!', response.data);
      const { user, token } = response.data;

      // 2. Save BOTH the token and the user to the hard drive!
      // (This is the fix that stops the app from logging you out on save)
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user)); // <-- NEW LINE ADDED HERE
      console.log('5. Token and User Data saved to local storage');

      // 3. Dispatch the data to Redux
      dispatch(setCredentials({ user, token }));
      console.log('6. Redux updated! Navigator should switch now.');
      
    } catch (error: any) {
      console.error('X. Login Error Caught!');
      console.error('Full Error:', error);
      console.error('Backend Message:', error.response?.data);
      Alert.alert('Login Failed', error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FinTrack</Text>
      <Text style={styles.subtitle}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#2C2C2C',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});