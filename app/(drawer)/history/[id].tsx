import { shareBill } from '@/utils/shareBill';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { deleteBillFromGoogleSheets, updateBillInGoogleSheets } from '../../../redux/billSlice';
import { AppDispatch, RootState } from '../../../redux/store';
import { printBill } from '../../../utils/printBill';

export default function BillDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Normalize ID (Ensure it's a string to prevent crashes)
  const billId = Array.isArray(id) ? id[0] : id;

  const bill = useSelector((state: RootState) =>
    state.billing.bills.find(b => b.id === billId)
  );

  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const handleAddPayment = async () => {
    if (!bill) return;

    const newPayment = parseFloat(paymentAmount);
    if (isNaN(newPayment) || newPayment <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    const currentPending = bill.pendingAmount ?? 0;
    if (newPayment > currentPending) {
      Alert.alert('Amount Too High', `Payment cannot exceed pending amount (₹${currentPending}).`);
      return;
    }

    const newPending = currentPending - newPayment;
    const currentAdvance = bill.advancePayment ?? 0;
    const newAdvance = currentAdvance + newPayment;
    const newStatus = newPending === 0 ? 'Paid' : bill.status;

    const newHistoryEntry = {
      date: new Date().toISOString(),
      amount: newPayment,
      method: paymentMethod
    };
    
    const newHistory = [...(bill.paymentHistory || []), newHistoryEntry];

    setIsSavingPayment(true);
    try {
      await dispatch(
        updateBillInGoogleSheets({
          id: bill.id,
          updates: { 
            pendingAmount: newPending, 
            advancePayment: newAdvance,
            status: newStatus,
            paymentHistory: newHistory
          },
        })
      ).unwrap();
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('Cash');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Could not update payment.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (!bill) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Bill not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await dispatch(deleteBillFromGoogleSheets(billId)).unwrap();
              router.back(); // Go back to history list
            } catch (error: any) {
              Alert.alert("Delete Failed", error.message);
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const printBillFun = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const formattedBill = {
        ...bill,
        date: formatDate(bill.date)
      };
      // 2. Pass this formatted version to the printer 
      await printBill(formattedBill);

    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error(error);
    } finally {
      setIsPrinting(false);
    }
  };

  const shareBillFun = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {

      const formattedBill = {
        ...bill,
        date: formatDate(bill.date)
      };

      await shareBill(formattedBill);
    } catch (error) {
      Alert.alert('Error', 'Failed to share PDF');
      console.error(error);
    } finally {
      setIsSharing(false);
    }
  };



  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };




  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bill Details</Text>

          <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#EF4444" /> : <Ionicons name="trash-outline" size={24} color="#EF4444" />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          {/* Invoice Meta */}
          <View style={styles.card}>
            <Text style={styles.invoiceId}>Bill ID: {bill.id}</Text>
            <Text style={styles.invoiceDate}>Date: {formatDate(bill.date)}</Text>
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Customer Information</Text>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Ionicons name="person" size={16} color="#3B82F6" /></View>
              <Text style={styles.infoText}>{bill.customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Ionicons name="call" size={16} color="#3B82F6" /></View>
              <Text style={styles.infoText}>{bill.customerPhone || 'N/A'}</Text>
            </View>


          </View>

          {/* Remarks Card */}
          {bill.remarks ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Remarks</Text>
              <Text style={styles.valueMeta}>{bill.remarks}</Text>
            </View>
          ) : null}

          {/* Items Table */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.7 }]}>Item</Text>
              <Text style={[styles.th, { flex: 0.8, textAlign: 'center' }]}>Qty / Unit</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>

            {bill.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.7 }]}>{item.name}</Text>
                <Text style={[styles.td, { flex: 0.8, textAlign: 'center' }]}>{item.qty}{item.type === 'product' ? ' ' + ((item as any).unit === 'Nos' ? 'Nos' : 'Box') : ''}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{item.rate.toLocaleString('en-IN')}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{item.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{bill.subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {/* Only show Tax/Discount if they exist */}
            {bill.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>₹{bill.tax.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {bill.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>-₹{bill.discount.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {/* Advance Payment */}
            {(bill.advancePayment || 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Advance Paid</Text>
                <Text style={[styles.totalValue, { color: '#3B82F6' }]}>-₹{(bill.advancePayment || 0).toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{Number(bill.grandTotal || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Payment History */}
          {(bill.paymentHistory && bill.paymentHistory.length > 0) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              {bill.paymentHistory.map((payment, index) => (
                <View key={index} style={styles.infoRow}>
                  <View style={styles.iconBox}><Ionicons name="cash" size={16} color="#059669" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoText}>Paid ₹{payment.amount.toLocaleString('en-IN')}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      {new Date(payment.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add Payment Button */}
          {((bill.pendingAmount ?? 0) > 0) && (
            <TouchableOpacity 
              style={[styles.fillButton, { marginBottom: 16, backgroundColor: '#1F2937' }]} 
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.fillButtonText}>Add Payment</Text>
            </TouchableOpacity>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.outlineButton, isPrinting && { opacity: 0.7 }]}
              onPress={printBillFun}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator color="#3B82F6" size="small" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="print" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.outlineButtonText}>{isPrinting ? "Printing..." : "Print"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fillButton, isSharing && { opacity: 0.7 }]}
              onPress={shareBillFun}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="share-social" size={20} color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.fillButtonText}>{isSharing ? "Sharing..." : "Share"}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        <Modal visible={showPaymentModal} transparent animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Payment</Text>
              <Text style={styles.modalSubtitle}>
                Pending: ₹{Number(bill.pendingAmount || 0).toLocaleString('en-IN')}
              </Text>

              <Text style={styles.labelMeta}>Payment Amount (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount received"
                autoFocus
              />

              <Text style={styles.labelMeta}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.methodBtn, paymentMethod === 'Cash' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('Cash')}
                >
                  <Ionicons name="cash-outline" size={18} color={paymentMethod === 'Cash' ? '#FFF' : '#6B7280'} />
                  <Text style={[styles.methodBtnText, paymentMethod === 'Cash' && styles.methodBtnTextActive]}>Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodBtn, paymentMethod === 'Online' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('Online')}
                >
                  <Ionicons name="card-outline" size={18} color={paymentMethod === 'Online' ? '#FFF' : '#6B7280'} />
                  <Text style={[styles.methodBtnText, paymentMethod === 'Online' && styles.methodBtnTextActive]}>Online</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
      setPaymentMethod('Cash');
                  }}
                  disabled={isSavingPayment}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isSavingPayment && { opacity: 0.7 }]}
                  onPress={handleAddPayment}
                  disabled={isSavingPayment}
                >
                  {isSavingPayment ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

// Keep your existing styles but add these two:
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  invoiceId: {
    fontSize: 14,
    color: '#6B7280'
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  infoText: {
    fontSize: 15,
    color: '#374151'
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  th: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  td: {
    fontSize: 14,
    color: '#111827'
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#059669' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#059669' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: '#FFF'
  },
  outlineButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600'
  },
  fillButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8
  },
  fillButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600'
  },
  // NEW STYLES for Metadata
  labelMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600'
  },
  valueMeta: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginTop: 2
  },
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
    marginTop: 6,
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

  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB',
  },
  methodBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  methodBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  methodBtnTextActive: { color: '#FFF' },

});