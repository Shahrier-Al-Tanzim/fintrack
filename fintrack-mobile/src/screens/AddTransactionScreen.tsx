import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../stores';
// --- NEW: Added updateTransaction here ---
import { addTransaction, fetchTransactions, updateTransaction } from '../stores/transactionSlice'; 
// --- NEW: Added useRoute to catch the data passed from Dashboard ---
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AddTransactionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>(); // Added <any> to prevent the TypeScript 'never' error
  const route = useRoute<any>(); 

  // --- NEW: Check if Dashboard sent a transaction to edit ---
  const transactionToEdit = route.params?.transaction;
  const isEditing = !!transactionToEdit; // true if we are editing, false if adding new

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState(''); 
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE'); 
  
  // --- NEW: Pre-fill the form instantly if we are in Edit Mode ---
  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description || '');
      setType(transactionToEdit.type);
    }
  }, [transactionToEdit]);

  const handleSave = async () => {
    if (!amount || !category) {
      Alert.alert('Error', 'Please fill out the amount and category');
      return;
    }

    try {
      // Prepare the data package
      const transactionData = {
        amount: parseFloat(amount), 
        category, 
        type,
        description: description || undefined 
      };

      // 1. Tell Redux to save the transaction to the backend
      if (isEditing) {
        // 🔄 IF EDITING: Update the existing transaction
        await dispatch(updateTransaction({ 
          id: transactionToEdit.id, 
          data: transactionData 
        })).unwrap();
      } else {
        // ➕ IF NEW: Add a brand new transaction
        await dispatch(addTransaction(transactionData)).unwrap(); 
      }

      // 2. NEW FIX: Force Redux to pull the freshest list of transactions from the database!
      await dispatch(fetchTransactions()).unwrap();

      // 3. Now that Redux is 100% updated, slide back to the Dashboard
      navigation.goBack();
    } catch (error) {
      Alert.alert(`Failed to ${isEditing ? 'update' : 'save'}`, error as string);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- NEW: Dynamic Title --- */}
      <Text style={styles.title}>{isEditing ? 'Edit Transaction' : 'New Transaction'}</Text>

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
        {/* --- NEW: Dynamic Button Text --- */}
        <Text style={styles.saveButtonText}>
          {isEditing ? 'Save Changes' : 'Save Transaction'}
        </Text>
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