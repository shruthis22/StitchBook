import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Bill, fetchBillsFromGoogleSheets, updateBillInGoogleSheets } from '../../../redux/billSlice';
import { AppDispatch, RootState } from '../../../redux/store';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function PendingPaymentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const navigation = useNavigation();
  const { bills, status } = useSelector((state: RootState) => state.billing);

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchBillsFromGoogleSheets());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchBillsFromGoogleSheets()).unwrap();
    } catch (error) {
      console.error('Refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const pendingBills = useMemo(() => {
    return bills
      .filter(bill => (bill.pendingAmount ?? 0) > 0)
      .filter(bill => {
        const q = search.toLowerCase();
        return (
          String(bill.customerName || '').toLowerCase().includes(q) ||
          String(bill.vehicleNumber || '').toLowerCase().includes(q) ||
          String(bill.id || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.pendingAmount ?? 0) - (a.pendingAmount ?? 0));
  }, [bills, search]);

  const totalPending = useMemo(
    () => pendingBills.reduce((sum, b) => sum + (b.pendingAmount ?? 0), 0),
    [pendingBills]
  );

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setEditAmount(String(bill.pendingAmount ?? 0));
  };

  const handleSavePending = async () => {
    if (!editingBill) return;

    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (0 or more).');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(
        updateBillInGoogleSheets({
          id: editingBill.id,
          updates: { pendingAmount: newAmount },
        })
      ).unwrap();
      setEditingBill(null);
      setEditAmount('');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Could not update pending amount.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Bill }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/(drawer)/history/[id]',
            params: { id: item.id },
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.vehicleInfo}>{item.vehicleNumber || 'N/A'}</Text>
          </View>
          <Text style={styles.pendingAmount}>₹{(item.pendingAmount ?? 0).toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.invoiceInfo}>
            Invoice {item.id} • {formatDate(item.date)} • Bill ₹{item.grandTotal.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.updateButton} onPress={() => openEditModal(item)}>
        <Ionicons name="create-outline" size={16} color="#3B82F6" />
        <Text style={styles.updateButtonText}>Update Pending</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pending Payments</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer, vehicle..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {pendingBills.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{pendingBills.length} pending bill(s)</Text>
              <Text style={styles.summaryTotal}>Total: ₹{totalPending.toFixed(2)}</Text>
            </View>
          )}

          <Text style={styles.hintText}>
            Only bills with pending amount greater than 0 appear here. Set to 0 when fully paid.
          </Text>
        </View>

        {status === 'loading' && bills.length === 0 && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={pendingBills}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24 }}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
                  No pending payments. All bills are fully paid or older bills have no pending amount set.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={!!editingBill} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Pending Amount</Text>
            {editingBill && (
              <Text style={styles.modalSubtitle}>
                {editingBill.customerName} — {editingBill.id}
              </Text>
            )}

            <Text style={styles.label}>Pending Amount (₹)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={editAmount}
              onChangeText={setEditAmount}
              placeholder="0 if fully paid"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingBill(null);
                  setEditAmount('');
                }}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSavePending}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterContainer: { padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  summaryLabel: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  summaryTotal: { fontSize: 15, color: '#D97706', fontWeight: '700' },
  hintText: { fontSize: 12, color: '#9CA3AF', marginTop: 10 },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  vehicleInfo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  pendingAmount: { fontSize: 18, fontWeight: '700', color: '#D97706' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  invoiceInfo: { fontSize: 13, color: '#6B7280' },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  updateButtonText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
