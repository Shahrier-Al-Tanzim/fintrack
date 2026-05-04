import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import api from '../services/api';
import { Bug, Server, ChevronLeft, Activity } from 'lucide-react-native';

const DebugSentryScreen = ({ navigation }: any) => {
  const [status, setStatus] = useState<string>('System Ready. Press a button to test.');
  const [dsnLoaded, setDsnLoaded] = useState<boolean>(!!process.env.EXPO_PUBLIC_SENTRY_DSN);

  const showFeedback = (title: string, message: string) => {
    setStatus(`${title}: ${message}`);
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const testMessage = () => {
    setStatus('Sending Sentry message...');
    try {
      Sentry.captureMessage("FinTrack Sentry Connectivity Test Message");
      showFeedback("Message Sent", "Check your Sentry dashboard for a 'Connectivity Test' message.");
    } catch (error: any) {
      showFeedback("Error", error.message);
    }
  };

  const testFrontend = () => {
    setStatus('Triggering frontend error...');
    try {
      // Force a real error object
      const error = new Error("Sentry Test: Manual Frontend Exception from Debug Screen!");
      Sentry.captureException(error);
      showFeedback("Frontend Error Sent", "Check Sentry dashboard for: " + error.message);
    } catch (error: any) {
      showFeedback("Exception Error", error.message);
    }
  };

  const testBackend = async () => {
    setStatus('Calling backend debug endpoint...');
    try {
      const response = await api.get('/debug-sentry');
      showFeedback("Backend Response", response.data);
    } catch (error: any) {
      console.error("Backend error triggered:", error);
      showFeedback(
        "Backend Error Triggered", 
        "The backend returned a 500 error as expected. This means the Sentry middleware should have caught it!"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Sentry Debugger</Text>
      </View>

      <View style={styles.statusCard}>
        <Activity color="#FF3366" size={20} />
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.card}>
        <Bug color="#FF3366" size={48} style={styles.icon} />
        <Text style={styles.cardTitle}>Frontend (React Native)</Text>
        <Text style={styles.cardDescription}>
          Current DSN Status: {dsnLoaded ? '✅ Loaded' : '❌ NOT LOADED'}
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={testMessage}>
          <Text style={styles.buttonText}>Send Test Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={testFrontend}>
          <Text style={[styles.buttonText, { color: '#FF3366' }]}>Capture Exception</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Server color="#4CAF50" size={48} style={styles.icon} />
        <Text style={styles.cardTitle}>Backend (Node.js)</Text>
        <Text style={styles.cardDescription}>
          Test if errors in the Express API are being captured.
        </Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={testBackend}>
          <Text style={styles.buttonText}>Trigger Backend Error</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Note: Make sure Sentry DSN is correctly configured in your environment variables.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#121212', 
    padding: 20,
    paddingTop: 60
  },
  statusCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF336633',
  },
  statusText: {
    color: '#FF3366',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: { 
    color: '#FFF', 
    fontSize: 28, 
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  icon: {
    marginBottom: 15,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDescription: {
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: { 
    backgroundColor: '#FF3366', 
    paddingVertical: 15, 
    paddingHorizontal: 25, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF3366',
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: 'bold',
    fontSize: 16
  },
  footer: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    fontStyle: 'italic'
  }
});

export default DebugSentryScreen;
