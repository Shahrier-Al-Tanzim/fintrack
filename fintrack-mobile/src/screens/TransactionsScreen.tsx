import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator, useWindowDimensions, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { useNavigation } from '@react-navigation/native';
import { fetchTransactions, deleteTransaction } from '../stores/transactionSlice';
import { fetchAccounts } from '../stores/accountSlice';
import { Transaction } from '../types';
import { Filter, X, ArrowUpRight, ArrowDownLeft, Edit2, Trash2, Calendar, Search, Tag } from 'lucide-react-native';

export default function TransactionsScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);
  const { accounts } = useSelector((state: RootState) => state.accounts);

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Instant Filter states
  const [type, setType] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchTransactions({}));
  }, [dispatch]);

  // INSTANT FRONTEND FILTERING LOGIC
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (type && t.type !== type) return false;
      if (accountId && (t as any).accountId !== accountId) return false;
      if (category && !t.category.toLowerCase().includes(category.toLowerCase())) return false;
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (maxAmount && t.amount > parseFloat(maxAmount)) return false;

      if (useDateFilter) {
        const tDate = new Date(t.date).getTime();
        if (startDate && tDate < new Date(startDate).getTime()) return false;
        if (endDate && tDate > new Date(endDate).getTime()) return false;
      }
      
      return true;
    });
  }, [transactions, type, accountId, category, minAmount, maxAmount, startDate, endDate, useDateFilter]);

  // DERIVED TOTALS FOR SUMMARY
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'INCOME') acc.income += t.amount;
      else acc.expense += t.amount;
      acc.net = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, net: 0 });
  }, [filteredTransactions]);

  const resetFilters = () => {
    setType(null);
    setAccountId(null);
    setCategory('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setUseDateFilter(false);
  };

  const openDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      setDetailVisible(false);
      navigation.navigate('AddTransaction', { transaction: selectedTransaction });
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
            <ArrowUpRight color="#4CAF50" size={22} />
          ) : (
            <ArrowDownLeft color="#F44336" size={22} />
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
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setIsFilterModalVisible(true)}>
          <Filter color="#FF3366" size={20} />
          <Text style={styles.filterBtnText}>
            Filters { (type || accountId || category || minAmount || maxAmount || startDate || endDate) ? '●' : '' }
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <Search color="#888" size={18} />
        <TextInput 
          style={styles.searchBar}
          placeholder="Search categories..."
          placeholderTextColor="#888"
          value={category}
          onChangeText={setCategory}
        />
        {category !== '' && (
          <TouchableOpacity onPress={() => setCategory('')}>
            <X color="#888" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>+${totals.income.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>-${totals.expense.toFixed(0)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryValue, { color: '#FFF' }]}>
            {totals.net >= 0 ? '+' : '-'}${Math.abs(totals.net).toFixed(0)}
          </Text>
        </View>
      </View>

      {loading && transactions.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF3366" />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Search color="#333" size={60} />
              <Text style={styles.emptyText}>No transactions match your filters.</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetLink}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Details</Text>
              <TouchableOpacity style={styles.closeCircle} onPress={() => setDetailModalVisible(false)}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, { color: selectedTransaction.type === 'INCOME' ? '#4CAF50' : '#F44336', fontSize: 24 }]}>
                    {selectedTransaction.type === 'INCOME' ? '+' : '-'}${selectedTransaction.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={styles.row}>
                    <Tag color="#FF3366" size={16} style={{ marginRight: 8 }} />
                    <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account</Text>
                  <Text style={styles.detailValue}>
                    {(selectedTransaction as any).accountName || accounts.find(a => a.id === (selectedTransaction as any).accountId)?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <View style={styles.row}>
                    <Calendar color="#888" size={16} style={{ marginRight: 8 }} />
                    <Text style={styles.detailValue}>{new Date(selectedTransaction.date).toLocaleDateString()}</Text>
                  </View>
                </View>
                {selectedTransaction.description && (
                  <View style={styles.descBox}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.descText}>{selectedTransaction.description}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.editModalBtn]} onPress={() => { setDetailModalVisible(false); navigation.navigate('AddTransaction', { transaction: selectedTransaction }); }}>
                    <Edit2 color="#FFF" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.modalBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.deleteModalBtn]} onPress={() => { setDeletingId(selectedTransaction.id); setDeleteModalVisible(true); }}>
                    <Trash2 color="#FFF" size={20} style={{ marginRight: 8 }} />
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
              <Text style={styles.modalTitle}>Refine History</Text>
              <TouchableOpacity style={styles.closeCircle} onPress={() => setIsFilterModalVisible(false)}>
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
                  <Text style={[styles.typeBtnText, type === 'INCOME' && { color: '#FFF' }]}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, type === 'EXPENSE' && styles.typeBtnActive]} 
                  onPress={() => setType(type === 'EXPENSE' ? null : 'EXPENSE')}
                >
                  <Text style={[styles.typeBtnText, type === 'EXPENSE' && { color: '#FFF' }]}>Expense</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Filter by Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountRow}>
                {accounts.map(acc => (
                  <TouchableOpacity 
                    key={acc.id} 
                    style={[styles.accountChip, accountId === acc.id && styles.accountChipActive]}
                    onPress={() => setAccountId(accountId === acc.id ? null : acc.id)}
                  >
                    <Text style={[styles.chipText, accountId === acc.id && { color: '#FFF' }]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Amount Range</Text>
              <View style={styles.row}>
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  keyboardType="numeric" 
                  placeholder="Min" 
                  placeholderTextColor="#555"
                  value={minAmount}
                  onChangeText={setMinAmount}
                />
                <View style={{ width: 15 }} />
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  keyboardType="numeric" 
                  placeholder="Max" 
                  placeholderTextColor="#555"
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                />
              </View>

              <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12 }]}>
                <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Date Range</Text>
                <TouchableOpacity 
                  style={[styles.toggleContainer, useDateFilter && styles.toggleActive]}
                  onPress={() => setUseDateFilter(!useDateFilter)}
                >
                  <View style={[styles.toggleCircle, useDateFilter && styles.toggleCircleActive]} />
                </TouchableOpacity>
              </View>

              <View style={{ opacity: useDateFilter ? 1 : 0.3 }} pointerEvents={useDateFilter ? 'auto' : 'none'}>
                <View style={styles.presetRow}>
                  <TouchableOpacity 
                    style={styles.presetChip} 
                    onPress={() => {
                      const d = new Date();
                      setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
                      setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
                    }}
                  >
                    <Text style={styles.chipText}>This Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.presetChip} 
                    onPress={() => {
                      const d = new Date();
                      setStartDate(`${d.getFullYear()}-01-01`);
                      setEndDate(`${d.getFullYear()}-12-31`);
                    }}
                  >
                    <Text style={styles.chipText}>This Year</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.row, { marginTop: 10 }]}>
                  {Platform.OS === 'web' ? (
                    <View style={{ flex: 1, flexDirection: 'row', gap: 15 }}>
                      <View style={[styles.dateInputBtn, { flex: 1, padding: 0 }]}>
                        <Calendar color="#FF3366" size={18} style={{ marginLeft: 15 }} />
                        <TextInput 
                          style={[styles.searchBar, { paddingVertical: 18 }]} 
                          type="date"
                          value={startDate}
                          onChangeText={setStartDate}
                        />
                      </View>
                      <View style={[styles.dateInputBtn, { flex: 1, padding: 0 }]}>
                        <Calendar color="#FF3366" size={18} style={{ marginLeft: 15 }} />
                        <TextInput 
                          style={[styles.searchBar, { paddingVertical: 18 }]} 
                          type="date"
                          value={endDate}
                          onChangeText={setEndDate}
                        />
                      </View>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[styles.dateInputBtn, { flex: 1 }]} 
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Calendar color="#FF3366" size={18} style={{ marginRight: 8 }} />
                        <Text style={styles.dateInputBtnText}>{startDate || 'From'}</Text>
                      </TouchableOpacity>
                      <View style={{ width: 15 }} />
                      <TouchableOpacity 
                        style={[styles.dateInputBtn, { flex: 1 }]} 
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Calendar color="#FF3366" size={18} style={{ marginRight: 8 }} />
                        <Text style={styles.dateInputBtnText}>{endDate || 'To'}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {Platform.OS !== 'web' && showStartPicker && (
                <DateTimePicker
                  value={startDate ? new Date(startDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      if (Platform.OS === 'android') setShowStartPicker(false);
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      if (endDate && selectedDate > new Date(endDate)) {
                        Alert.alert("Invalid Date", "From date cannot be after to date");
                        return;
                      }
                      setStartDate(dateStr);
                    }
                  }}
                />
              )}

              {Platform.OS !== 'web' && showEndPicker && (
                <DateTimePicker
                  value={endDate ? new Date(endDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      if (Platform.OS === 'android') setShowEndPicker(false);
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      if (startDate && selectedDate < new Date(startDate)) {
                        Alert.alert("Invalid Date", "To date cannot be before from date");
                        return;
                      }
                      setEndDate(dateStr);
                    }
                  }}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterModalVisible(false)}>
                <Text style={styles.applyBtnText}>Show Results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayBlur}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIconContainer}>
              <Trash2 color="#F44336" size={40} />
            </View>
            <Text style={styles.deleteTitle}>Delete Record?</Text>
            <Text style={styles.deleteSubtitle}>
              This action cannot be undone. Your account balance will be adjusted accordingly.
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
  header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', letterSpacing: -1 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, gap: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  filterBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', marginHorizontal: 25, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 10 },
  searchBar: { flex: 1, color: '#FFF', marginLeft: 10, fontSize: 16 },
  summaryContainer: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.04)', marginHorizontal: 25, paddingVertical: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 5, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 25, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  summaryLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 25, paddingBottom: 100 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  categoryText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  accountText: { color: '#FF3366', fontSize: 13, marginTop: 2, fontWeight: '600' },
  amountBox: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: 'bold' },
  dateText: { color: '#666', fontSize: 12, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#555', fontSize: 16, marginTop: 20, textAlign: 'center' },
  resetLink: { color: '#FF3366', fontWeight: 'bold', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalOverlayBlur: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '80%', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  detailContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, height: '70%', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', letterSpacing: -0.5 },
  closeCircle: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 20 },
  detailsList: { gap: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  detailLabel: { color: '#888', fontSize: 15, fontWeight: '500' },
  detailValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  descBox: { backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 15, borderRadius: 15, marginTop: 10 },
  descText: { color: '#AAA', fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 30 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  editModalBtn: { backgroundColor: 'rgba(33, 150, 243, 0.15)', borderWidth: 1, borderColor: 'rgba(33, 150, 243, 0.3)' },
  deleteModalBtn: { backgroundColor: 'rgba(244, 67, 54, 0.15)', borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.3)' },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  filterForm: { flex: 1 },
  label: { color: '#FF3366', fontSize: 13, fontWeight: 'bold', marginBottom: 12, marginTop: 25, textTransform: 'uppercase', letterSpacing: 1 },
  typeRow: { flexDirection: 'row', gap: 15 },
  typeBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  typeBtnActive: { backgroundColor: '#FF3366', borderColor: '#FF3366' },
  typeBtnText: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  accountRow: { flexDirection: 'row', marginBottom: 10 },
  accountChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  accountChipActive: { backgroundColor: '#FF3366', borderColor: '#FF3366' },
  chipText: { color: '#888', fontSize: 14, fontWeight: '600' },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  presetChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  toggleContainer: { width: 45, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: 'rgba(255, 51, 102, 0.2)', borderWidth: 1, borderColor: '#FF3366' },
  toggleCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#555' },
  toggleCircleActive: { alignSelf: 'flex-end', backgroundColor: '#FF3366' },
  dateInputBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  dateInputBtnText: { color: '#FFF', fontSize: 15, fontWeight: '500' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.03)', color: '#FFF', padding: 18, borderRadius: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  row: { flexDirection: 'row', alignItems: 'center' },
  modalFooter: { flexDirection: 'row', gap: 15, marginTop: 30, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 25 },
  resetBtn: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  resetBtnText: { color: '#888', fontWeight: 'bold' },
  applyBtn: { flex: 2, padding: 18, borderRadius: 15, alignItems: 'center', backgroundColor: '#FF3366' },
  applyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  deleteModalContent: { backgroundColor: '#1A1A1A', borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  deleteIconContainer: { width: 90, height: 90, borderRadius: 30, backgroundColor: 'rgba(244, 67, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  deleteTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  deleteSubtitle: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 35, lineHeight: 24 },
  deleteActions: { flexDirection: 'row', gap: 15, width: '100%' },
  cancelBtn: { flex: 1, padding: 18, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, padding: 18, borderRadius: 15, backgroundColor: '#F44336', alignItems: 'center' },
  confirmDeleteBtnText: { color: '#FFF', fontWeight: 'bold' }
});
