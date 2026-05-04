import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as Sentry from '@sentry/react-native';
import api from '../services/api';
import { Bug, Server, ChevronLeft } from 'lucide-react-native';

const DebugSentryScreen = ({ navigation }: any) => {
  const testFrontend = () => {
    console.log("Triggering frontend Sentry error...");
    // Using Sentry.captureException for a non-fatal test or throw for a fatal one
    try {
      throw new Error("Sentry Test: Manual Frontend Exception from Debug Screen!");
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert("Frontend Error Sent", "Check your Sentry Frontend project dashboard.");
    }
  };

  const testFatalFrontend = () => {
    Alert.alert(
      "Warning",
      "This will crash the app. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Crash Now", 
          style: "destructive",
          onPress: () => {
            throw new Error("Sentry Test: FATAL Frontend Crash!");
          } 
        }
      ]
    );
  };

  const testBackend = async () => {
    try {
      console.log("Triggering backend Sentry error...");
      // Using the /api/debug-sentry route we just added
      const response = await api.get('/debug-sentry');
      Alert.alert("Backend Response", response.data);
    } catch (error: any) {
      console.error("Backend error triggered:", error);
      Alert.alert(
        "Backend Error Triggered", 
        "The backend returned a 500 error as expected. Check your Sentry Backend project dashboard."
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

      <View style={styles.card}>
        <Bug color="#FF3366" size={48} style={styles.icon} />
        <Text style={styles.cardTitle}>Frontend (React Native)</Text>
        <Text style={styles.cardDescription}>
          Test if errors in the mobile/web app are being captured.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={testFrontend}>
          <Text style={styles.buttonText}>Capture Exception</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={testFatalFrontend}>
          <Text style={[styles.buttonText, { color: '#FF3366' }]}>Trigger Fatal Crash</Text>
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
