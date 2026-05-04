import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, Dimensions, ScrollView, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../stores'; 
import { logout } from '../stores/authSlice';
import { fetchTransactions, deleteTransaction } from '../stores/transactionSlice';
import { fetchAccounts } from '../stores/accountSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Account } from '../types';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { LogOut, Download, CreditCard, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react-native';

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);
  const { accounts } = useSelector((state: RootState) => state.accounts);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(fetchAccounts());
  }, [dispatch]);

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
              dispatch(fetchAccounts()); // Refresh accounts after deletion
            } catch (error) {
              Alert.alert("Delete Failed!", error as string);
            }
          } 
        }
      ]
    );
  };

  const handleExport = () => {
    if (Platform.OS === 'web') {
      window.open('http://localhost:5000/api/transactions/export', '_blank');
    } else {
      Alert.alert("Export", "Export is currently supported on Web.");
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Prepare line chart data (Balance trend)
  const sortedTxs = [...safeTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBalance = totalBalance - safeTransactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
  
  const balanceHistory = sortedTxs.slice(-6).map(t => {
    runningBalance += (t.type === 'INCOME' ? t.amount : -t.amount);
    return runningBalance;
  });

  const chartLabels = sortedTxs.slice(-6).map(t => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ["No Data"],
    datasets: [
      {
        data: balanceHistory.length > 0 ? balanceHistory : [0],
        color: (opacity = 1) => `rgba(255, 51, 102, ${opacity})`,
        strokeWidth: 2
      }
    ]
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Accounts</Text>
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

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Balance Trend</Text>
          {safeTransactions.length > 1 ? (
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.emptyText}>Add more transactions to see trends.</Text>
          )}
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.scrollableContainer}>
            <ScrollView 
              nestedScrollEnabled 
              style={styles.scrollableTransactions}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#FF3366" style={{ marginTop: 20 }} />
              ) : safeTransactions.length === 0 ? (
                <Text style={styles.emptyText}>No transactions yet.</Text>
              ) : (
                safeTransactions.map(item => (
                  <React.Fragment key={item.id}>
                    {renderTransactionItem({ item })}
                  </React.Fragment>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Transaction Detail Modal */}
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
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#888', fontSize: 16, marginBottom: 5 },
  balanceLabel: { color: '#FFF', fontSize: 14, opacity: 0.8 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', gap: 15 },
  iconButton: { padding: 5 },
  section: { marginBottom: 25, paddingLeft: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  accountList: { paddingRight: 20 },
  accountCard: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 15, width: 140, marginRight: 15, alignItems: 'center' },
  accountName: { color: '#888', fontSize: 12, marginTop: 8, marginBottom: 4 },
  accountBalance: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  chartContainer: { padding: 20, marginBottom: 10 },
  chart: { borderRadius: 16, marginTop: 10 },
  transactionsSection: { padding: 20, paddingBottom: 100 },
  scrollableContainer: { height: 380, backgroundColor: '#2C2C2E', borderRadius: 20, padding: 10 },
  scrollableTransactions: { flex: 1 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, marginBottom: 10 },
  transactionIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transactionInfo: { flex: 1 },
  transactionMainInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  transactionCategory: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  transactionAccount: { color: '#FF3366', fontSize: 13, fontWeight: '500' },
  transactionDate: { color: '#888', fontSize: 12, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 10, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2C2C2E', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  detailsList: { gap: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#888', fontSize: 14 },
  detailValue: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 30 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  editModalBtn: { backgroundColor: '#2196F3' },
  deleteModalBtn: { backgroundColor: '#F44336' },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});