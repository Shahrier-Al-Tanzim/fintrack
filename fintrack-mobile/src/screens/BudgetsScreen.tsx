import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { fetchBudgets, addBudget } from '../stores/budgetSlice';

export default function BudgetsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { budgets, loading } = useSelector((state: RootState) => state.budgets);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    dispatch(fetchBudgets());
  }, [dispatch]);

  const handleAdd = async () => {
    if (!amount) {
      Alert.alert('Error', 'Amount is required');
      return;
    }
    try {
      await dispatch(addBudget({ amount: parseFloat(amount), category, duration: 'MONTH' })).unwrap();
      setAmount('');
      setCategory('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add budget');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Budgets</Text>

      <View style={styles.addForm}>
        <TextInput style={styles.input} placeholder="Amount (e.g. 500)" placeholderTextColor="#888" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TextInput style={styles.input} placeholder="Category (optional)" placeholderTextColor="#888" value={category} onChangeText={setCategory} />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Create Budget</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.budgetName}>{item.category || 'Overall'}</Text>
            <Text style={styles.amount}>Limit: ${item.amount.toFixed(2)} / {item.duration}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No budgets found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, marginTop: 30 },
  addForm: { marginBottom: 20, backgroundColor: '#2C2C2E', padding: 15, borderRadius: 10 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 16 },
  addButton: { backgroundColor: '#FF3366', padding: 12, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 10, marginBottom: 15 },
  budgetName: { color: '#fff', fontSize: 18, marginBottom: 5 },
  amount: { color: '#FF9800', fontSize: 16 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
});
