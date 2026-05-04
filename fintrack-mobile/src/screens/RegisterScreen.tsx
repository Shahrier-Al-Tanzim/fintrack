import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../stores';
import { register } from '../stores/authSlice'; // Assuming this exists in your authSlice
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleRegister = async () => {
    console.log('--- REGISTRATION START ---');
    console.log('1. Clearing previous errors and starting registration process');
    setError(null);

    if (!name || !email || !password) {
      console.log('2. [ERROR] Missing name, email or password');
      setError('Please fill in all fields');
      return;
    }

    console.log(`3. Form valid. Name: ${name}, Email: ${email}`);
    try {
      console.log('4. Dispatching register action to Redux...');
      await dispatch(register({ name, email, password })).unwrap();
      
      console.log('5. Registration successful! Navigating to Login screen');
      navigation.navigate('Login');
    } catch (err: any) {
      console.log('X. [ERROR] Registration failed caught in catch block');
      let errorMessage = err.message || (typeof err === 'string' ? err : 'Registration failed');
      
      if (err.details && err.details.length > 0) {
        const detailMessages = err.details.map((d: any) => d.message).join(', ');
        errorMessage = `${errorMessage}: ${detailMessages}`;
        console.log('   Validation Issues:', detailMessages);
      }
      
      setError(errorMessage);
    } finally {
      console.log('--- REGISTRATION END ---');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join FinTrack to manage your budget</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Full Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={(text) => { setName(text); setError(null); }}
        />

        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Email Address"
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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.link}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 25, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 36, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 40, marginTop: 10 },
  errorContainer: { backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: 15, borderRadius: 10, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14, fontWeight: '500' },
  inputContainer: { width: '100%' },
  input: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: 'rgba(244, 67, 54, 0.5)' },
  button: { backgroundColor: '#FF3366', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 5, shadowColor: '#FF3366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  footerText: { color: '#888', textAlign: 'center', marginTop: 30, fontSize: 16 },
  link: { color: '#FF3366', fontWeight: 'bold' }
});