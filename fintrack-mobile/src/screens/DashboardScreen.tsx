import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, Dimensions, ScrollView, Modal, Linking, LayoutAnimation, useWindowDimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../stores'; 
import { logout } from '../stores/authSlice';
import { fetchTransactions, deleteTransaction } from '../stores/transactionSlice';
import { fetchAccounts } from '../stores/accountSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Account } from '../types';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { fetchBudgets } from '../stores/budgetSlice';
import { LogOut, Download, CreditCard, ArrowUpRight, ArrowDownLeft, X, Target } from 'lucide-react-native';
import { API_BASE_URL } from '../services/api';

const DEFAULT_ORDER = ['ACCOUNTS', 'BUDGETS', 'CHART', 'TRANSACTIONS'];

export default function DashboardScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);
  const { accounts } = useSelector((state: RootState) => state.accounts);
  const { budgets } = useSelector((state: RootState) => state.budgets);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const savedOrder = await AsyncStorage.getItem(`dashboardOrder_${user?.id}`);
        if (savedOrder) {
          setSectionOrder(JSON.parse(savedOrder));
        }
      } catch (e) {
        console.error("Failed to load dashboard order", e);
      }
    };
    loadOrder();
    console.log("🚀 Dashboard: Fetching data...");
    dispatch(fetchTransactions({}));
    dispatch(fetchAccounts());
    dispatch(fetchBudgets());
  }, [dispatch, user?.id]);

  const saveOrder = async (newOrder: string[]) => {
    setSectionOrder(newOrder);
    try {
      await AsyncStorage.setItem(`dashboardOrder_${user?.id}`, JSON.stringify(newOrder));
    } catch (e) {
      console.error("Failed to save dashboard order", e);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken'); 
    await AsyncStorage.removeItem('userData'); 
    dispatch(logout()); 
  };

  const handleUpdate = (item: Transaction) => {
    setDetailVisible(false);
    navigation.navigate('AddTransaction', { transaction: item });
  };

  const handleDelete = (id: string) => {
    setDetailVisible(false);
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to delete this?");
      if (confirmed) {
        dispatch(deleteTransaction(id)).unwrap().catch(error => window.alert("Delete Failed: " + error));
      }
      return; 
    }

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
              dispatch(fetchAccounts());
            } catch (error) {
              Alert.alert("Delete Failed!", error as string);
            }
          } 
        }
      ]
    );
  };

  const handleExport = () => {
    const exportUrl = `${API_BASE_URL}/transactions/export?token=${token}`;
    
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = 'transactions.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Linking.openURL(exportUrl).catch(err => {
        Alert.alert("Export Error", "Could not open export link.");
        console.error(err);
      });
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const [movedItem] = newOrder.splice(index, 1);
      newOrder.splice(targetIndex, 0, movedItem);
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      saveOrder(newOrder);
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const sortedTxs = [...safeTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBalance = totalBalance - safeTransactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
  
  const balanceHistory = sortedTxs.slice(-6).map(t => {
    runningBalance += (t.type === 'INCOME' ? t.amount : -t.amount);
    return runningBalance;
  });

  const chartLabels = sortedTxs.slice(-6).map(t => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ["No Data"],
    datasets: [{
      data: balanceHistory.length > 0 ? balanceHistory : [0],
      color: (opacity = 1) => `rgba(255, 51, 102, ${opacity})`,
      strokeWidth: 2
    }]
  };

  const chartConfig = {
    backgroundColor: "#1E1E1E",
    backgroundGradientFrom: "#2C2C2E",
    backgroundGradientTo: "#2C2C2E",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#FF3366" }
  };

  const openDetails = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setDetailVisible(true);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.transactionCard} onPress={() => openDetails(item)}>
      <View style={styles.transactionIconContainer}>
        {item.type === 'INCOME' ? (
          <ArrowUpRight color="#4CAF50" size={20} />
        ) : (
          <ArrowDownLeft color="#F44336" size={20} />
        )}
      </View>
      <View style={styles.transactionInfo}>
        <View style={styles.transactionMainInfo}>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionAccount}>
            • {(item as any).accountName || accounts.find(a => a.id === (item as any).accountId)?.name || 'N/A'}
          </Text>
        </View>
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.type === 'INCOME' ? '#4CAF50' : '#F44336' }]}>
        {item.type === 'INCOME' ? '+' : '-'}${item.amount.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderAccountItem = ({ item }: { item: Account }) => (
    <View style={styles.accountCard}>
      <CreditCard color="#FF3366" size={20} />
      <Text style={styles.accountName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.accountBalance}>${item.balance.toFixed(2)}</Text>
    </View>
  );

  const renderSectionHeader = (title: string, index: number, showSeeAll = false) => (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionTitleGroup}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {showSeeAll && (
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.reorderButtons}>
        {index > 0 && (
          <TouchableOpacity onPress={() => moveSection(index, 'up')} style={styles.reorderBtn}>
            <Text style={styles.reorderBtnText}>▲</Text>
          </TouchableOpacity>
        )}
        {index < sectionOrder.length - 1 && (
          <TouchableOpacity onPress={() => moveSection(index, 'down')} style={styles.reorderBtn}>
            <Text style={styles.reorderBtnText}>▼</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleExport}>
            <Download color="#FF3366" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut color="#888" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {sectionOrder.map((section, index) => {
          if (section === 'ACCOUNTS') {
            return (
              <View key="ACCOUNTS" style={styles.section}>
                {renderSectionHeader('My Accounts', index)}
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={accounts}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAccountItem}
                  contentContainerStyle={styles.accountList}
                  ListEmptyComponent={<Text style={styles.emptyText}>No accounts found.</Text>}
                />
              </View>
            );
          }
          if (section === 'BUDGETS') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            
            return (
              <View key="BUDGETS" style={styles.section}>
                {renderSectionHeader('Budget Progress', index)}
                <View style={styles.budgetList}>
                  {budgets.length === 0 ? (
                    <TouchableOpacity 
                      style={styles.emptyBudgetCard} 
                      onPress={() => navigation.navigate('Budgets')}
                    >
                      <Target color="#555" size={30} />
                      <Text style={styles.emptyBudgetText}>No budgets set. Tap to start!</Text>
                    </TouchableOpacity>
                  ) : (
                    budgets.slice(0, 2).map(budget => {
                      const spent = transactions
                        .filter(t => t.type === 'EXPENSE' && new Date(t.date) >= firstDay && (!budget.category || t.category.toLowerCase() === budget.category.toLowerCase()))
                        .reduce((sum, t) => sum + t.amount, 0);
                      const progress = Math.min(spent / budget.amount, 1);
                      const isOver = spent > budget.amount;

                      return (
                        <View key={budget.id} style={styles.dashboardBudgetCard}>
                          <View style={styles.budgetInfo}>
                            <Text style={styles.budgetCategory}>{budget.category || 'General'}</Text>
                            <Text style={styles.budgetAmount}>${spent.toFixed(0)} / ${budget.amount.toFixed(0)}</Text>
                          </View>
                          <View style={styles.dashboardProgressBar}>
                            <View style={[styles.dashboardProgressFill, { width: `${progress * 100}%`, backgroundColor: isOver ? '#F44336' : '#4CAF50' }]} />
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            );
          }
          if (section === 'CHART') {
            return (
              <View key="CHART" style={styles.chartSection}>
                {renderSectionHeader('Balance Trends', index)}
                <View style={styles.chartCard}>
                  <LineChart
                    data={chartData}
                    width={windowWidth - 70}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </View>
            );
          }
          if (section === 'TRANSACTIONS') {
            return (
              <View key="TRANSACTIONS" style={styles.transactionsSection}>
                {renderSectionHeader('Recent Transactions', index, true)}
                <View style={styles.scrollableContainer}>
                  {loading ? (
                    <ActivityIndicator size="large" color="#FF3366" style={{ marginTop: 20 }} />
                  ) : safeTransactions.length === 0 ? (
                    <Text style={styles.emptyText}>No transactions yet.</Text>
                  ) : (
                    safeTransactions.slice(0, 5).map(item => (
                      <View key={item.id}>
                        {renderTransactionItem({ item })}
                      </View>
                    ))
                  )}
                </View>
              </View>
            );
          }
          return null;
        })}
      </ScrollView>

      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>
            {selectedTransaction && (
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, { color: selectedTransaction.type === 'INCOME' ? '#4CAF50' : '#F44336' }]}>
                    {selectedTransaction.type === 'INCOME' ? '+' : '-'}${selectedTransaction.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{new Date(selectedTransaction.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account</Text>
                  <Text style={styles.detailValue}>
                    {(selectedTransaction as any).accountName || accounts.find(a => a.id === (selectedTransaction as any).accountId)?.name || 'N/A'}
                  </Text>
                </View>
                {selectedTransaction.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.editModalBtn]} onPress={() => handleUpdate(selectedTransaction)}>
                    <Text style={styles.modalBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.deleteModalBtn]} onPress={() => handleDelete(selectedTransaction.id)}>
                    <Text style={styles.modalBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { padding: 25, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 5, letterSpacing: -0.5 },
  balanceLabel: { color: '#FF3366', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { color: '#FFF', fontSize: 42, fontWeight: 'bold', letterSpacing: -1 },
  headerActions: { flexDirection: 'row', gap: 15 },
  iconButton: { padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  scrollContent: { paddingBottom: 100 },
  section: { marginBottom: 35 },
  sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  seeAll: { color: '#FF3366', fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  reorderButtons: { flexDirection: 'row', gap: 10 },
  reorderBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  reorderBtnText: { color: '#FFF', fontSize: 14 },
  accountList: { paddingLeft: 25, paddingRight: 25 },
  accountCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 20, width: 150, marginRight: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  accountName: { color: '#AAA', fontSize: 13, marginTop: 10, marginBottom: 5, fontWeight: '600' },
  accountBalance: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  budgetList: { paddingHorizontal: 25 },
  dashboardBudgetCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  budgetInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budgetCategory: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  budgetAmount: { color: '#888', fontSize: 14, fontWeight: '600' },
  dashboardProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  dashboardProgressFill: { height: '100%', borderRadius: 3 },
  emptyBudgetCard: { backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 25, borderRadius: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  emptyBudgetText: { color: '#555', marginTop: 10, fontWeight: '600' },
  chartSection: { marginBottom: 35 },
  chartCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 15, alignItems: 'center', marginHorizontal: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  chart: { borderRadius: 16, marginTop: 10 },
  transactionsSection: { marginBottom: 35 },
  scrollableContainer: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 15, marginHorizontal: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  transactionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 18, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  transactionIconContainer: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transactionInfo: { flex: 1 },
  transactionMainInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  transactionCategory: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  transactionAccount: { color: '#FF3366', fontSize: 13, fontWeight: '600' },
  transactionDate: { color: '#777', fontSize: 12, marginTop: 3 },
  transactionAmount: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 15, fontSize: 15, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, minHeight: 450, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', letterSpacing: -0.5 },
  detailsList: { gap: 25 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  detailLabel: { color: '#888', fontSize: 15, fontWeight: '500' },
  detailValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 35 },
  modalBtn: { flex: 1, padding: 18, borderRadius: 15, alignItems: 'center' },
  editModalBtn: { backgroundColor: 'rgba(33, 150, 243, 0.15)', borderWidth: 1, borderColor: 'rgba(33, 150, 243, 0.3)' },
  deleteModalBtn: { backgroundColor: 'rgba(244, 67, 54, 0.15)', borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.3)' },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 }
});