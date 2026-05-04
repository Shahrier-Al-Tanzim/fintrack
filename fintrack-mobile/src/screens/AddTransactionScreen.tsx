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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
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
    setError(null);
    if (!amount || !category) {
      setError('Please fill out the amount and category');
      return;
    }

    if (!accountId) {
      setError('Please select an account for this transaction');
      return;
    }

    setLoading(true);
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
    } catch (err: any) {
      setError(err || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccountName = accounts.find(a => a.id === accountId)?.name || 'Select an Account';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Edit Transaction' : 'New Transaction'}</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'EXPENSE' && styles.expenseActive]}
          onPress={() => { setType('EXPENSE'); setError(null); }}
        >
          <Text style={styles.toggleText}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, type === 'INCOME' && styles.incomeActive]}
          onPress={() => { setType('INCOME'); setError(null); }}
        >
          <Text style={styles.toggleText}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, error && !amount && styles.inputError]}
        placeholder="Amount (e.g. 50.00)"
        placeholderTextColor="#888"
        value={amount}
        onChangeText={(text) => { setAmount(text); setError(null); }}
        keyboardType="numeric"
      />

      <TextInput
        style={[styles.input, error && !category && styles.inputError]}
        placeholder="Category (e.g. Groceries, Salary)"
        placeholderTextColor="#888"
        value={category}
        onChangeText={(text) => { setCategory(text); setError(null); }}
      />

      <View style={styles.accountSelection}>
        <Text style={styles.label}>Select Account:</Text>
        <TouchableOpacity 
          style={[styles.dropdownButton, error && !accountId && styles.errorInput]} 
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {accounts.length === 0 ? 'No Accounts Created' : selectedAccountName}
          </Text>
          <Text style={styles.dropdownButtonIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Dropdown Modal */}
      <Modal visible={isDropdownOpen} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            {accounts.length === 0 ? (
              <View style={styles.emptyDropdown}>
                <Text style={styles.emptyDropdownText}>Please create an account first.</Text>
                <TouchableOpacity 
                  style={styles.createAccountBtn} 
                  onPress={() => {
                    setIsDropdownOpen(false);
                    navigation.navigate('Accounts');
                  }}
                >
                  <Text style={styles.createAccountBtnText}>Go to Accounts</Text>
                </TouchableOpacity>
              </View>
            ) : (
              accounts.map(acc => (
                <TouchableOpacity
                  key={acc.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setAccountId(acc.id);
                    setError(null);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, accountId === acc.id && styles.dropdownItemTextActive]}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
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

      <TouchableOpacity 
        style={[styles.saveButton, loading && { opacity: 0.7 }]} 
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Transaction')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1E1E1E', padding: 25, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  errorContainer: { backgroundColor: 'rgba(244, 67, 54, 0.1)', padding: 15, borderRadius: 10, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 14, fontWeight: '500' },
  toggleContainer: { flexDirection: 'row', marginBottom: 25, borderRadius: 12, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 18, backgroundColor: '#2C2C2E', alignItems: 'center' },
  expenseActive: { backgroundColor: '#F44336' },
  incomeActive: { backgroundColor: '#4CAF50' },
  toggleText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: 'rgba(244, 67, 54, 0.5)' },
  textArea: { height: 100, textAlignVertical: 'top' }, 
  label: { color: '#888', fontSize: 14, marginBottom: 10, marginLeft: 5 },
  accountSelection: { marginBottom: 25 },
  dropdownButton: { backgroundColor: '#2C2C2E', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownButtonText: { color: '#FFF', fontSize: 16 },
  dropdownButtonIcon: { color: '#FFF', fontSize: 12 },
  errorInput: { borderColor: '#F44336', borderWidth: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  dropdownMenu: { backgroundColor: '#2C2C2E', width: '85%', borderRadius: 15, paddingVertical: 10, elevation: 10 },
  emptyDropdown: { padding: 25, alignItems: 'center' },
  emptyDropdownText: { color: '#888', marginBottom: 20, textAlign: 'center', fontSize: 16 },
  createAccountBtn: { backgroundColor: '#FF3366', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  createAccountBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  dropdownItem: { paddingVertical: 18, paddingHorizontal: 25, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  dropdownItemText: { color: '#FFF', fontSize: 16 },
  dropdownItemTextActive: { color: '#FF3366', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#FF3366', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 5 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  cancelButton: { padding: 18, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#888', fontSize: 16 }
});