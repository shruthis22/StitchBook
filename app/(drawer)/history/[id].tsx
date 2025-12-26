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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { deleteBillFromGoogleSheets } from '../../../redux/billSlice';
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

            {/* UPDATED: Vehicle Name + Number */}
            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Ionicons name="car" size={16} color="#3B82F6" /></View>
              <View>
                <Text style={styles.infoText}>
                  {bill.vehicleName ? `${bill.vehicleName} - ` : ''}{bill.vehicleNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* NEW: Service Details Card (KM & Remarks) */}
          {(bill.currentKm || bill.nextServiceKm || bill.remarks) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Service Details</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View>
                  <Text style={styles.labelMeta}>Current KM</Text>
                  <Text style={styles.valueMeta}>{bill.currentKm || 'N/A'}</Text>
                </View>
                <View>
                  <Text style={styles.labelMeta}>Next Service KM</Text>
                  <Text style={styles.valueMeta}>{bill.nextServiceKm || 'N/A'}</Text>
                </View>
              </View>

              {bill.remarks ? (
                <View style={{ marginTop: 8, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
                  <Text style={[styles.labelMeta, { marginBottom: 4 }]}>Remarks:</Text>
                  <Text style={{ color: '#374151', fontStyle: 'italic' }}>{bill.remarks}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Items Table */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Item Details</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Item</Text>
              <Text style={[styles.th, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>

            {bill.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2 }]}>{item.name}</Text>
                <Text style={[styles.td, { flex: 0.5, textAlign: 'center' }]}>{item.qty}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{item.rate.toFixed(2)}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{item.amount.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{bill.subtotal.toFixed(2)}</Text>
            </View>
            {/* Only show Tax/Discount if they exist */}
            {bill.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>₹{bill.tax.toFixed(2)}</Text>
              </View>
            )}
            {bill.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>-₹{bill.discount.toFixed(2)}</Text>
              </View>
            )}

            {/* Advance Payment */}
            {(bill.advancePayment || 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Advance Paid</Text>
                <Text style={[styles.totalValue, { color: '#3B82F6' }]}>-₹{(bill.advancePayment || 0).toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{(bill.grandTotal || 0)
              }</Text>
            </View>
          </View>

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
  }
});