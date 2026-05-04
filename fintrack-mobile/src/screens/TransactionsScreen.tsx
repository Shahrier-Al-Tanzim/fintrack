import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { fetchTransactions } from '../stores/transactionSlice';
import { fetchAccounts } from '../stores/accountSlice';
import { Transaction } from '../types';
import { Filter, X, ArrowUpRight, ArrowDownLeft, FilterX } from 'lucide-react-native';

export default function TransactionsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);
  const { accounts } = useSelector((state: RootState) => state.accounts);

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  // Filter states
  const [type, setType] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchAccounts());
    applyFilters();
  }, [dispatch]);

  const applyFilters = () => {
    const filters: any = {};
    if (type) filters.type = type;
    if (accountId) filters.accountId = accountId;
    if (category) filters.category = category;
    if (minAmount) filters.minAmount = minAmount;
    if (maxAmount) filters.maxAmount = maxAmount;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    dispatch(fetchTransactions(filters));
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setType(null);
    setAccountId(null);
    setCategory('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    dispatch(fetchTransactions({}));
    setIsFilterModalVisible(false);
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          {item.type === 'INCOME' ? (
            <ArrowUpRight color="#4CAF50" size={20} />
          ) : (
            <ArrowDownLeft color="#F44336" size={20} />
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.categoryText}>{item.category}</Text>
          <Text style={styles.accountText}>
            {(item as any).accountName || accounts.find(a => a.id === (item as any).accountId)?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={[styles.amountText, { color: item.type === 'INCOME' ? '#4CAF50' : '#F44336' }]}>
            {item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}
          </Text>
          <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.descriptionText}>{item.description}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setIsFilterModalVisible(true)}>
          <Filter color="#FFF" size={20} />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF3366" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Transaction Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'INCOME' && styles.typeBtnActive]} 
                  onPress={() => setType(type === 'INCOME' ? null : 'INCOME')}
                >
                  <Text style={styles.typeBtnText}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'EXPENSE' && styles.typeBtnActive]} 
                  onPress={() => setType(type === 'EXPENSE' ? null : 'EXPENSE')}
                >
                  <Text style={styles.typeBtnText}>Expense</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountRow}>
                {accounts.map(acc => (
                  <TouchableOpacity 
                    key={acc.id} 
                    style={[styles.accountChip, accountId === acc.id && styles.accountChipActive]}
                    onPress={() => setAccountId(accountId === acc.id ? null : acc.id)}
                  >
                    <Text style={styles.chipText}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Category</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Search category..." 
                placeholderTextColor="#888" 
                value={category}
                onChangeText={setCategory}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Min Amount</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="0.00" 
                    placeholderTextColor="#888"
                    value={minAmount}
                    onChangeText={setMinAmount}
                  />
                </View>
                <View style={{ width: 15 }} />
                <View style={styles.flex1}>
                  <Text style={styles.label}>Max Amount</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="No limit" 
                    placeholderTextColor="#888"
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>From Date</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="YYYY-MM-DD" 
                    placeholderTextColor="#888"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={{ width: 15 }} />
                <View style={styles.flex1}>
                  <Text style={styles.label}>To Date</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="YYYY-MM-DD" 
                    placeholderTextColor="#888"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 8 },
  filterBtnText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#2C2C2E', borderRadius: 15, padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  categoryText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  accountText: { color: '#FF3366', fontSize: 12, marginTop: 2 },
  amountBox: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: 'bold' },
  dateText: { color: '#888', fontSize: 11, marginTop: 4 },
  descriptionText: { color: '#AAA', fontSize: 13, marginTop: 10, fontStyle: 'italic' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 50, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  filterForm: { flex: 1 },
  label: { color: '#888', fontSize: 14, marginBottom: 10, marginTop: 15 },
  typeRow: { flexDirection: 'row', gap: 15 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#2C2C2E', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#FF3366' },
  typeBtnText: { color: '#FFF', fontWeight: 'bold' },
  accountRow: { flexDirection: 'row', marginBottom: 10 },
  accountChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2C2C2E', marginRight: 10 },
  accountChipActive: { backgroundColor: '#FF3366' },
  chipText: { color: '#FFF', fontSize: 13 },
  input: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 15, borderRadius: 10, fontSize: 16 },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  modalFooter: { flexDirection: 'row', gap: 15, marginTop: 20, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 },
  resetBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: '#333' },
  resetBtnText: { color: '#FFF', fontWeight: 'bold' },
  applyBtn: { flex: 2, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: '#FF3366' },
  applyBtnText: { color: '#FFF', fontWeight: 'bold' },
});
