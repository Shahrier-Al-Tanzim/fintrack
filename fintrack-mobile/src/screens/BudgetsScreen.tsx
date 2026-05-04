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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBudgets());
  }, [dispatch]);

  const handleAdd = async () => {
    setError(null);
    if (!amount) {
      setError('Amount is required');
      return;
    }
    try {
      await dispatch(addBudget({ amount: parseFloat(amount), category, duration: 'MONTH' })).unwrap();
      setAmount('');
      setCategory('');
    } catch (e) {
      setError('Failed to add budget');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Budgets</Text>

      <View style={styles.addForm}>
        <Text style={styles.formLabel}>Set New Monthly Budget</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput 
          style={[styles.input, error && !amount && styles.inputError]} 
          placeholder="Amount (e.g. 500)" 
          placeholderTextColor="#888" 
          keyboardType="numeric" 
          value={amount} 
          onChangeText={(text) => { setAmount(text); setError(null); }} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Category (optional)" 
          placeholderTextColor="#888" 
          value={category} 
          onChangeText={setCategory} 
        />
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
        ListEmptyComponent={loading ? <ActivityIndicator color="#FF3366" /> : <Text style={styles.emptyText}>No budgets found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 25 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 25, marginTop: 40 },
  addForm: { marginBottom: 30, backgroundColor: '#2C2C2E', padding: 20, borderRadius: 15 },
  formLabel: { color: '#FFF', fontSize: 14, marginBottom: 15, opacity: 0.7 },
  errorContainer: { backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: 12, borderRadius: 10, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 13, fontWeight: '500' },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: 'rgba(244, 67, 54, 0.5)' },
  addButton: { backgroundColor: '#FF3366', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 5 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#2C2C2E', padding: 20, borderRadius: 15, marginBottom: 15 },
  budgetName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  amount: { color: '#FF3366', fontSize: 16, fontWeight: '500' },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
});
