import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { useNavigation } from '@react-navigation/native';
import { fetchTransactions, deleteTransaction } from '../stores/transactionSlice';
import { fetchAccounts } from '../stores/accountSlice';
import { Transaction } from '../types';
import { Filter, X, ArrowUpRight, ArrowDownLeft, Edit2, Trash2 } from 'lucide-react-native';

export default function TransactionsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);
  const { accounts } = useSelector((state: RootState) => state.accounts);

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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

  const openDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      setDetailModalVisible(false);
      navigation.navigate('AddTransaction', { transaction: selectedTransaction });
    }
  };

  const openDeleteConfirm = () => {
    if (selectedTransaction) {
      setDeletingId(selectedTransaction.id);
      setDeleteModalVisible(true);
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await dispatch(deleteTransaction(deletingId));
      await dispatch(fetchAccounts()); 
      setDeleteModalVisible(false);
      setDetailModalVisible(false);
      setDeletingId(null);
      setSelectedTransaction(null);
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetails(item)}>
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
        <Text style={styles.descriptionText} numberOfLines={1}>{item.description}</Text>
      ) : null}
    </TouchableOpacity>
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

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.detailContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={[styles.detailValue, { color: selectedTransaction.type === 'INCOME' ? '#4CAF50' : '#F44336' }]}>
                    {selectedTransaction.type}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>${selectedTransaction.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account</Text>
                  <Text style={styles.detailValue}>
                    {(selectedTransaction as any).accountName || accounts.find(a => a.id === (selectedTransaction as any).accountId)?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{new Date(selectedTransaction.date).toLocaleDateString()}</Text>
                </View>
                {selectedTransaction.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.editModalBtn]} onPress={handleEdit}>
                    <Text style={styles.modalBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.deleteModalBtn]} onPress={openDeleteConfirm}>
                    <Text style={styles.modalBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

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

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Trash2 color="#F44336" size={40} />
            </View>
            <Text style={styles.deleteTitle}>Delete Transaction?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure? This will permanently remove this record and update your account balance.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteBtnText}>Delete</Text>
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
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, height: '85%' },
  detailContent: { backgroundColor: '#2C2C2E', borderRadius: 20, padding: 25, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  detailsList: { gap: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#3A3A3C', paddingBottom: 12 },
  detailLabel: { color: '#888', fontSize: 15 },
  detailValue: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  editModalBtn: { backgroundColor: '#2196F3' },
  deleteModalBtn: { backgroundColor: '#F44336' },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
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
  
  // Delete Modal Styles
  deleteModalContent: { backgroundColor: '#2C2C2E', borderRadius: 20, padding: 30, alignItems: 'center' },
  deleteIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(244, 67, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  deleteTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  deleteSubtitle: { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  deleteActions: { flexDirection: 'row', gap: 15, width: '100%' },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#3A3A3C', alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#F44336', alignItems: 'center' },
  confirmDeleteBtnText: { color: '#FFF', fontWeight: 'bold' }
});
