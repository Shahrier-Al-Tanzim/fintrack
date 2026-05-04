import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../stores';
import { fetchAccounts, addAccount, updateAccount, deleteAccount } from '../stores/accountSlice';
import { Edit2, Trash2, X, Plus } from 'lucide-react-native';

export default function AccountsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, loading } = useSelector((state: RootState) => state.accounts);
  
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleAdd = async () => {
    if (!name) return;
    try {
      await dispatch(addAccount({ name, balance: balance ? parseFloat(balance) : 0 })).unwrap();
      setName('');
      setBalance('');
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (account: any) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditBalance(account.balance.toString());
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editName) return;
    try {
      await dispatch(updateAccount({ 
        id: editingAccount.id, 
        data: { name: editName, balance: parseFloat(editBalance) } 
      })).unwrap();
      setEditModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setDeletingAccountId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (deletingAccountId) {
      await dispatch(deleteAccount(deletingAccountId));
      setDeleteModalVisible(false);
      setDeletingAccountId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Accounts</Text>
      
      <View style={styles.addForm}>
        <Text style={styles.formLabel}>Create New Account</Text>
        <TextInput style={styles.input} placeholder="Account Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Initial Balance" placeholderTextColor="#888" keyboardType="numeric" value={balance} onChangeText={setBalance} />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Plus color="#FFF" size={20} />
          <Text style={styles.addButtonText}>Add Account</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.balance}>${item.balance.toFixed(2)}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                <Edit2 color="#2196F3" size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openDeleteConfirm(item.id)}>
                <Trash2 color="#F44336" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#FF3366" /> : <Text style={styles.emptyText}>No accounts found.</Text>}
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Account</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Account Name" placeholderTextColor="#888" value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Balance" placeholderTextColor="#888" keyboardType="numeric" value={editBalance} onChangeText={setEditBalance} />

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <View style={styles.deleteIconContainer}>
              <Trash2 color="#F44336" size={40} />
            </View>
            <Text style={styles.deleteTitle}>Delete Account?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure? This action cannot be undone. Your transaction history will still exist but will lose its reference to this account.
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
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 25, marginTop: 40 },
  addForm: { marginBottom: 30, backgroundColor: '#2C2C2E', padding: 20, borderRadius: 15 },
  formLabel: { color: '#FFF', fontSize: 14, marginBottom: 15, opacity: 0.7 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  addButton: { backgroundColor: '#FF3366', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#2C2C2E', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  accountName: { color: '#888', fontSize: 14, marginBottom: 5 },
  balance: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', gap: 15 },
  actionBtn: { padding: 5 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#2C2C2E', borderRadius: 20, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#FF3366', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  // Delete Modal Styles
  deleteModalContent: { alignItems: 'center', paddingVertical: 40 },
  deleteIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(244, 67, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  deleteTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  deleteSubtitle: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  deleteActions: { flexDirection: 'row', gap: 15, width: '100%' },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#3A3A3C', alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  confirmDeleteBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#F44336', alignItems: 'center' },
  confirmDeleteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
