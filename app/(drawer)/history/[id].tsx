import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { SafeAreaView } from 'react-native-safe-area-context';




export default function BillDetailsScreen() {

  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  
  const bill = useSelector((state: RootState) => 
    state.billing.bills.find(b => b.id === id)
  );

  if (!bill) return <View style={styles.safeArea}><Text>Bill not found</Text></View>;




  return (
    <SafeAreaView style={styles.safeArea}>


      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
        <View style={{width: 24}} />
      </View>



      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Invoice Meta */}
        <View style={styles.card}>

          <Text style={styles.invoiceId}>Bill ID: {bill.id}</Text>
          <Text style={styles.invoiceDate}>Date: {bill.date}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Ionicons name="person" size={16} color="#3B82F6" /></View>
            <Text style={styles.infoText}>{bill.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Ionicons name="call" size={16} color="#3B82F6" /></View>
            <Text style={styles.infoText}>{bill.customerPhone || '+1 234 567 890'}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Ionicons name="car" size={16} color="#3B82F6" /></View>
            <Text style={styles.infoText}>{bill.vehicleNumber}</Text>
          </View>
        </View>




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
          
          {/* Fallback if no items */}
          {bill.items.length === 0 && (
            <View style={styles.tableRow}>
               <Text style={[styles.td, { flex: 2 }]}>Service Charge</Text>
               <Text style={[styles.td, { flex: 0.5, textAlign: 'center' }]}>1</Text>
               <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{bill.amount}</Text>
               <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{bill.amount}</Text>
            </View>
          )}

          <View style={styles.divider} />


          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>₹{bill.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>₹{bill.tax.toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.totalValue}>-₹{bill.discount.toFixed(2)}</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{bill.grandTotal.toFixed(2)}</Text>
          </View>

        </View>

        


        <View style={styles.buttonContainer}>

          <TouchableOpacity style={styles.outlineButton}>
            <Ionicons name="print" size={20} color="#3B82F6" style={{marginRight: 8}}/>
            <Text style={styles.outlineButtonText}>Print</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fillButton}>
            <Ionicons name="share-social" size={20} color="#FFF" style={{marginRight: 8}}/>
            <Text style={styles.fillButtonText}>Share</Text>
          </TouchableOpacity>
          
        </View>



      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  invoiceId: { fontSize: 14, color: '#6B7280' },
  invoiceDate: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  infoText: { fontSize: 15, color: '#374151' },
  
  // Table
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  th: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tableRow: { flexDirection: 'row', marginBottom: 12 },
  td: { fontSize: 14, color: '#111827' },
  
  // Totals
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#059669' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#059669' },

  // Buttons
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  outlineButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingVertical: 12, marginRight: 8, backgroundColor: '#FFF'
  },
  outlineButtonText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
  fillButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 12, marginLeft: 8
  },
  fillButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});