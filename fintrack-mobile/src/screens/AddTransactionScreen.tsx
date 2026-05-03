import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../stores';
import { addTransaction, fetchTransactions } from '../stores/transactionSlice'; // <-- NEW: Added fetchTransactions here
import { useNavigation } from '@react-navigation/native';

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState(''); 
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE'); 
  
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const handleSave = async () => {
    if (!amount || !category) {
      Alert.alert('Error', 'Please fill out the amount and category');
      return;
    }

    try {
      // 1. Tell Redux to save the new transaction to the backend
      await dispatch(addTransaction({ 
        amount: parseFloat(amount), 
        category, 
        type,
        description: description || undefined 
      })).unwrap(); 

      // 2. NEW FIX: Force Redux to pull the freshest list of transactions from the database!
      await dispatch(fetchTransactions()).unwrap();

      // 3. Now that Redux is 100% updated, slide back to the Dashboard
      navigation.goBack();
    } catch (error) {
      Alert.alert('Failed to save', error as string);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Transaction</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'EXPENSE' && styles.expenseActive]}
          onPress={() => setType('EXPENSE')}
        >
          <Text style={styles.toggleText}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'INCOME' && styles.incomeActive]}
          onPress={() => setType('INCOME')}
        >
          <Text style={styles.toggleText}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Amount (e.g. 50.00)"
        placeholderTextColor="#888"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Category (e.g. Groceries, Salary)"
        placeholderTextColor="#888"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Transaction</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  toggleContainer: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 15, backgroundColor: '#2C2C2C', alignItems: 'center' },
  expenseActive: { backgroundColor: '#F44336' },
  incomeActive: { backgroundColor: '#4CAF50' },
  toggleText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: '#2C2C2C', color: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' }, 
  saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  cancelButton: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#888', fontSize: 16 }
});