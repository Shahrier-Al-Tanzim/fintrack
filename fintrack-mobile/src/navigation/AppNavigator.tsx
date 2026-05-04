import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { setCredentials } from '../stores/authSlice';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Home, CreditCard, PieChart, PlusCircle, List } from 'lucide-react-native';

import AddTransactionScreen from '../screens/AddTransactionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AccountsScreen from '../screens/AccountsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import DebugSentryScreen from '../screens/DebugSentryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: [
    'https://fintrack-v6l3.onrender.com', 
    'https://fintrack-mobile.onrender.com',
    'fintrack://'
  ],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      Main: {
        screens: {
          Dashboard: '',
          Transactions: 'transactions',
          Accounts: 'accounts',
          Budgets: 'budgets',
          AddTransaction: 'add-transaction',
        }
      },
      DebugSentry: 'debug-sentry',
    },
  },
};  

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
        },
        tabBarActiveTintColor: '#FF3366', // Poppy color
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="History" 
        component={TransactionsScreen} 
        options={{ tabBarIcon: ({ color, size }) => <List color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen} 
        options={{ 
          tabBarIcon: ({ color, size }) => <PlusCircle color="#4CAF50" size={32} />, // Larger poppy icon for Add
          tabBarLabel: 'Add' 
        }}
      />
      <Tab.Screen 
        name="Accounts" 
        component={AccountsScreen} 
        options={{ tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsScreen} 
        options={{ tabBarIcon: ({ color, size }) => <PieChart color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isReady, setIsReady] = useState(false); 

  useEffect(() => {
    const checkMemory = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userString = await AsyncStorage.getItem('userData');
        
        if (token && userString) {
          const user = JSON.parse(userString);
          dispatch(setCredentials({ user, token }));
        }
      } catch (error) {
        console.error('Failed to restore memory:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkMemory();
  }, [dispatch]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} fallback={<ActivityIndicator size="large" color="#FF3366" />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
        <Stack.Screen name="DebugSentry" component={DebugSentryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}