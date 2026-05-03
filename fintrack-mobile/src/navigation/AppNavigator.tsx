import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { setCredentials } from '../stores/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddTransactionScreen from '../screens/AddTransactionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  
  // 1. Read the memory from our Redux brain
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  // Create a loading state so the app pauses while it checks the hard drive
  const [isReady, setIsReady] = useState(false); 

  useEffect(() => {
    const checkMemory = async () => {
      try {
        // Look in the hard drive for both the token AND the user data
        const token = await AsyncStorage.getItem('userToken');
        const userString = await AsyncStorage.getItem('userData');
        
        // If we found a saved session, shove it back into Redux!
        if (token && userString) {
          const user = JSON.parse(userString);
          dispatch(setCredentials({ user, token }));
        }
      } catch (error) {
        console.error('Failed to restore memory:', error);
      } finally {
        // Tell the app we are done checking, it's safe to load the screens
        setIsReady(true);
      }
    };

    checkMemory();
  }, [dispatch]);

  // Show a dark screen with a green spinner while checking storage
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // 2. If NOT logged in, only give them access to these two screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // 3. If logged in, only give them access to the secure app
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}