import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { fetchBudgets, addBudget, updateBudget, deleteBudget } from '../stores/budgetSlice';
import { fetchTransactions } from '../stores/transactionSlice';
import { Trash2, Plus, Target, AlertCircle, X, ChevronRight } from 'lucide-react-native';

export default function BudgetsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { budgets, loading, error: budgetError } = useSelector((state: RootState) => state.budgets);
  const { transactions } = useSelector((state: RootState) => state.transactions);

  // Form States
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Delete State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchBudgets()).unwrap().catch(err => console.error("Fetch Budgets Error:", err));
    dispatch(fetchTransactions());
  }, [dispatch]);

  const budgetStats = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return budgets.map(budget => {
      const spent = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          const isThisMonth = tDate >= firstDayOfMonth;
          const matchesCategory = !budget.category || t.category.toLowerCase() === budget.category.toLowerCase();
          return t.type === 'EXPENSE' && isThisMonth && matchesCategory;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const progress = spent / budget.amount;
      const remaining = budget.amount - spent;
      return { ...budget, spent, progress, remaining };
    });
  }, [budgets, transactions]);

  const handleAdd = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Invalid Amount", "Please enter a numeric value for the budget.");
      return;
    }
    
    setIsProcessing(true);
    try {
      await dispatch(addBudget({ 
        amount: parseFloat(amount), 
        category: category.trim() || undefined, 
        duration: 'MONTH' 
      })).unwrap();
      
      setAmount('');
      setCategory('');
      setIsAddVisible(false);
      Alert.alert("Success", "Budget limit set successfully!");
    } catch (err: any) {
      Alert.alert("Failed to Create", err || "Check your backend connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) {
      Alert.alert("Invalid Amount", "Please enter a numeric value.");
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(updateBudget({ 
        id: editingBudget.id, 
        data: { 
          amount: parseFloat(editAmount), 
          category: editCategory.trim() || undefined 
        } 
      })).unwrap();
      setEditModalVisible(false);
      Alert.alert("Updated", "Budget changes saved.");
    } catch (err: any) {
      Alert.alert("Update Failed", err || "Check if the server is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingBudget) return;
    setIsProcessing(true);
    try {
      await dispatch(deleteBudget(editingBudget.id)).unwrap();
      setDeleteModalVisible(false);
      setEditModalVisible(false);
      setEditingBudget(null);
      Alert.alert("Deleted", "Budget has been removed.");
    } catch (err: any) {
      Alert.alert("Delete Failed", err || "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isOver = item.spent > item.amount;
    const isNear = !isOver && item.progress > 0.8;

    return (
      <TouchableOpacity style={styles.card} onPress={() => {
        setEditingBudget(item);
        setEditAmount(item.amount.toString());
        setEditCategory(item.category || '');
        setEditModalVisible(true);
      }}>
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconCircle, { backgroundColor: isOver ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)' }]}>
              <Target color={isOver ? '#F44336' : '#4CAF50'} size={20} />
            </View>
            <View>
              <Text style={styles.categoryTitle}>{item.category || 'Global Budget'}</Text>
              <Text style={styles.limitText}>Target: ${item.amount.toFixed(0)}</Text>
            </View>
          </View>
          <ChevronRight color="#444" size={20} />
        </View>

        <View style={styles.progressBox}>
          <View style={styles.progressBarBg}>
            <View style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(item.progress * 100, 100)}%`,
                backgroundColor: isOver ? '#F44336' : isNear ? '#FF9800' : '#4CAF50'
              }
            ]} />
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.spentText}>${item.spent.toFixed(0)} spent</Text>
            <Text style={[styles.remainingText, isOver && { color: '#F44336' }]}>
              {isOver ? `Over by $${Math.abs(item.remaining).toFixed(0)}` : `$${item.remaining.toFixed(0)} left`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>Track Monthly Limits</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, isAddVisible && { backgroundColor: '#333' }]} 
          onPress={() => setIsAddVisible(!isAddVisible)}
        >
          {isAddVisible ? <X color="#FFF" size={24} /> : <Plus color="#FFF" size={24} />}
        </TouchableOpacity>
      </View>

      {budgetError && (
        <View style={styles.errorBanner}>
          <AlertCircle color="#FFF" size={16} />
          <Text style={styles.errorText}>{budgetError}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isAddVisible && (
          <View style={styles.addForm}>
            <Text style={styles.formLabel}>Set Limit</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Amount (e.g. 1000)" 
              placeholderTextColor="#555" 
              keyboardType="numeric" 
              value={amount} 
              onChangeText={setAmount} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Category Name" 
              placeholderTextColor="#555" 
              value={category} 
              onChangeText={setCategory} 
            />
            <TouchableOpacity 
              style={[styles.createBtn, isProcessing && { opacity: 0.6 }]} 
              onPress={handleAdd}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>Create Budget</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listContainer}>
          {loading && budgets.length === 0 ? (
            <ActivityIndicator color="#FF3366" size="large" style={{ marginTop: 50 }} />
          ) : (
            budgetStats.map(item => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Budget</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} placeholder="Category" placeholderTextColor="#555" />
              <Text style={styles.inputLabel}>Monthly Amount</Text>
              <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor="#555" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.updateBtn, isProcessing && { opacity: 0.6 }]} onPress={handleUpdate} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteAction} onPress={() => setDeleteModalVisible(true)}>
                  <Trash2 color="#F44336" size={18} />
                  <Text style={styles.deleteActionText}>Remove Budget</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal (Slides from bottom) */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteContent}>
            <View style={styles.deleteIconBox}>
              <Trash2 color="#F44336" size={32} />
            </View>
            <Text style={styles.deleteTitle}>Delete Budget?</Text>
            <Text style={styles.deleteText}>This will remove the limit for {editingBudget?.category || 'this category'}. Your transaction data will not be affected.</Text>
            
            <View style={styles.deleteButtons}>
              <TouchableOpacity style={styles.keepBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.keepBtnText}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmDelete} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Yes, Delete</Text>}
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
  header: { padding: 25, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', letterSpacing: -1 },
  subtitle: { color: '#FF3366', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
  addBtn: { backgroundColor: '#FF3366', width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 12 },
  errorBanner: { backgroundColor: '#F44336', flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 25, borderRadius: 12, gap: 10, marginBottom: 15 },
  errorText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 100 },
  addForm: { marginHorizontal: 25, marginBottom: 30, backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 22, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  formLabel: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#FFF', padding: 18, borderRadius: 16, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  createBtn: { backgroundColor: '#FF3366', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', height: 60 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  listContainer: { paddingHorizontal: 25 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 28, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  categoryTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  limitText: { color: '#888', fontSize: 13, marginTop: 2 },
  progressBox: { marginTop: 5 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  spentText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  remainingText: { color: '#888', fontSize: 14, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 35, padding: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  closeBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 8, borderRadius: 20 },
  modalBody: { gap: 2 },
  inputLabel: { color: '#FF3366', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginLeft: 5, letterSpacing: 1 },
  modalActions: { marginTop: 20, gap: 10 },
  updateBtn: { backgroundColor: '#FF3366', padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', height: 60 },
  updateBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  deleteAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, gap: 10 },
  deleteActionText: { color: '#F44336', fontWeight: 'bold', fontSize: 15 },

  // Sliding Delete Modal Styles
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  deleteContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  deleteIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(244, 67, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  deleteTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  deleteText: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 35, lineHeight: 24 },
  deleteButtons: { flexDirection: 'row', gap: 15, width: '100%' },
  keepBtn: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 18, borderRadius: 18, alignItems: 'center' },
  keepBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  confirmBtn: { flex: 1, backgroundColor: '#F44336', padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
