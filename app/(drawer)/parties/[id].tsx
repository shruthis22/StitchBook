import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Bill } from '../../../redux/billSlice';

export default function PartyDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();

  const { bills } = useSelector((state: RootState) => state.billing);

  const partyBills = bills.filter(
    b => b.customerName?.trim().toLowerCase() === (name as string).trim().toLowerCase()
  );

  // Totals
  const totalBilled = partyBills.reduce((s, b) => s + (Number(b.grandTotal) || Number(b.amount) || 0), 0);
  const totalPaid = partyBills.reduce((s, b) => {
    return s + (b.paymentHistory || []).reduce((ps, p) => ps + Number(p.amount), 0);
  }, 0);
  const totalPending = Math.max(0, totalBilled - totalPaid);

  const renderBillItem = ({ item }: { item: Bill }) => {
    const billed = Number(item.grandTotal) || Number(item.amount) || 0;
    const paid = (item.paymentHistory || []).reduce((s, p) => s + Number(p.amount), 0);
    const pending = Math.max(0, billed - paid);
    const isPaid = pending === 0;

    return (
      <TouchableOpacity
        style={styles.billCard}
        onPress={() => router.push({ pathname: '/(drawer)/history/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.billRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.billId}>{item.id}</Text>
            <Text style={styles.billDate}>{item.date}</Text>
            <View style={styles.itemsList}>
              {(item.items || []).slice(0, 2).map((it, idx) => (
                <Text key={idx} style={styles.itemText}>• {it.name} × {it.qty}</Text>
              ))}
              {(item.items || []).length > 2 && (
                <Text style={styles.itemText}>+{(item.items || []).length - 2} more</Text>
              )}
            </View>
          </View>
          <View style={styles.billAmounts}>
            <Text style={styles.billedAmt}>₹{billed.toFixed(0)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isPaid ? '#F0FDF4' : '#FEF2F2' }]}>
              <Text style={[styles.statusText, { color: isPaid ? '#16A34A' : '#EF4444' }]}>
                {isPaid ? 'Paid' : `₹${pending.toFixed(0)} due`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
            <Ionicons name="receipt-outline" size={22} color="#3B82F6" />
            <Text style={styles.summaryValue}>₹{totalBilled.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Total Billed</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#16A34A" />
            <Text style={styles.summaryValue}>₹{totalPaid.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <Ionicons name="time-outline" size={22} color="#EF4444" />
            <Text style={styles.summaryValue}>₹{totalPending.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        {/* Bills count label */}
        <Text style={styles.sectionLabel}>
          {partyBills.length} Bill{partyBills.length !== 1 ? 's' : ''}
        </Text>

        {/* Bills list */}
        {partyBills.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No bills for this party yet</Text>
          </View>
        ) : (
          [...partyBills].reverse().map(bill => (
            <View key={bill.id}>
              {renderBillItem({ item: bill })}
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  summaryContainer: {
    flexDirection: 'row', padding: 16, gap: 10,
  },
  summaryCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 6,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: 0.5, marginHorizontal: 16, marginBottom: 8,
  },
  billCard: {
    backgroundColor: '#FFF', borderRadius: 12, marginHorizontal: 16,
    marginBottom: 10, padding: 16, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  billRow: { flexDirection: 'row', alignItems: 'flex-start' },
  billId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  billDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemsList: { marginTop: 6 },
  itemText: { fontSize: 12, color: '#374151' },
  billAmounts: { alignItems: 'flex-end', gap: 8 },
  billedAmt: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
