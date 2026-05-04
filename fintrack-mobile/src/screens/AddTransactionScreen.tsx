import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { addTransaction, fetchTransactions, updateTransaction } from '../stores/transactionSlice'; 
import { fetchAccounts } from '../stores/accountSlice';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AddTransactionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>(); 
  const route = useRoute<any>(); 

  const transactionToEdit = route.params?.transaction;
  const isEditing = !!transactionToEdit; 

  const { accounts } = useSelector((state: RootState) => state.accounts);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState(''); 
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE'); 
  const [accountId, setAccountId] = useState<string | undefined>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description || '');
      setType(transactionToEdit.type);
      setAccountId(transactionToEdit.accountId);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [transactionToEdit, accounts]);

  const handleSave = async () => {
    if (!amount || !category) {
      Alert.alert('Error', 'Please fill out the amount and category');
      return;
    }

    try {
      const transactionData = {
        amount: parseFloat(amount), 
        category, 
        type,
        description: description || undefined,
        accountId
      };

      if (isEditing) {
        await dispatch(updateTransaction({ 
          id: transactionToEdit.id, 
          data: transactionData 
        })).unwrap();
      } else {
        await dispatch(addTransaction(transactionData as any)).unwrap(); 
      }

      await dispatch(fetchTransactions()).unwrap();
      await dispatch(fetchAccounts()).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert(`Failed to ${isEditing ? 'update' : 'save'}`, error as string);
    }
  };

  const selectedAccountName = accounts.find(a => a.id === accountId)?.name || 'Select an Account';

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {accounts.length > 0 && (
        <View style={styles.accountSelection}>
          <Text style={styles.label}>Select Account:</Text>
          <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setIsDropdownOpen(true)}
          >
            <Text style={styles.dropdownButtonText}>{selectedAccountName}</Text>
            <Text style={styles.dropdownButtonIcon}>▼</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Dropdown Modal */}
      <Modal visible={isDropdownOpen} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setAccountId(acc.id);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, accountId === acc.id && styles.dropdownItemTextActive]}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
        <Text style={styles.saveButtonText}>
          {isEditing ? 'Save Changes' : 'Save Transaction'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1E1E1E', padding: 20, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  toggleContainer: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 15, backgroundColor: '#2C2C2C', alignItems: 'center' },
  expenseActive: { backgroundColor: '#F44336' },
  incomeActive: { backgroundColor: '#4CAF50' },
  toggleText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: '#2C2C2C', color: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' }, 
  label: { color: '#FFF', fontSize: 16, marginBottom: 10 },
  accountSelection: { marginBottom: 15 },
  dropdownButton: { backgroundColor: '#2C2C2C', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownButtonText: { color: '#FFF', fontSize: 16 },
  dropdownButtonIcon: { color: '#FFF', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  dropdownMenu: { backgroundColor: '#2C2C2C', width: '80%', borderRadius: 8, paddingVertical: 10, elevation: 5 },
  dropdownItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  dropdownItemText: { color: '#FFF', fontSize: 16 },
  dropdownItemTextActive: { color: '#FF3366', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#FF3366', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  cancelButton: { padding: 15, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#888', fontSize: 16 }
});