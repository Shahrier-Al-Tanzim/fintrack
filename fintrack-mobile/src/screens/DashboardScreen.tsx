import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../stores'; 
import { logout } from '../stores/authSlice';
import { fetchTransactions, deleteTransaction } from '../stores/transactionSlice'; // <-- NEW: Imported deleteTransaction
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';
import { useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken'); 
    await AsyncStorage.removeItem('userData'); 
    dispatch(logout()); 
  };

  // --- NEW: The Delete Handler with a safety confirmation pop-up ---
  // --- NEW: Web-Smart Delete Handler ---
  const handleDelete = (id: string) => {
    // 🌐 If running on a Web Browser
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to delete this?");
      if (confirmed) {
        dispatch(deleteTransaction(id))
          .unwrap()
          .catch(error => window.alert("Delete Failed: " + error));
      }
      return; // Stop here so it doesn't trigger the mobile alert below
    }

    // 📱 If running on iOS or Android
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await dispatch(deleteTransaction(id)).unwrap();
            } catch (error) {
              Alert.alert("Delete Failed!", error as string);
            }
          } 
        }
      ]
    );
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const balance = safeTransactions.reduce((acc, curr) => {
    return curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  // --- UPDATED: renderItem now includes a Delete Button ---
  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        {item.description ? (
          <Text style={styles.transactionDescription} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      
      {/* Container for the price and the delete button */}
      <View style={styles.rightSide}>
        <Text style={[styles.transactionAmount, { color: item.type === 'INCOME' ? '#4CAF50' : '#F44336' }]}>
          {item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        
        {/* The Delete Button itself */}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
      ) : safeTransactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet. Add one!</Text>
      ) : (
        <FlatList
          data={safeTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction' as never)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 40, marginBottom: 30 },
  greeting: { color: '#888', fontSize: 16, marginBottom: 5 },
  balanceLabel: { color: '#FFF', fontSize: 14, opacity: 0.8 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  logoutText: { color: '#FFF', fontSize: 14 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2C2C2C', padding: 15, borderRadius: 10, marginBottom: 10 },
  transactionInfo: { flex: 1, paddingRight: 10 }, 
  transactionCategory: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  transactionDescription: { color: '#AAA', fontSize: 13, marginTop: 4 }, 
  transactionDate: { color: '#888', fontSize: 12, marginTop: 4 },
  
  // --- NEW: Right side alignment for price and delete button ---
  rightSide: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  deleteButton: { backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  deleteButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#4CAF50', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  fabText: { color: '#FFF', fontSize: 30, fontWeight: 'bold', marginTop: -2 }
});