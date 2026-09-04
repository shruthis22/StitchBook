import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { fetchStockLedgerFromGoogleSheets, fetchBillsFromGoogleSheets, fetchCustomersFromGoogleSheets } from '../../../redux/billSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../redux/store';
import { useNavigation, useRouter } from 'expo-router';

type Period = 'today' | 'week' | 'month';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('today');

  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(fetchBillsFromGoogleSheets());
    dispatch(fetchCustomersFromGoogleSheets());
    dispatch(fetchStockLedgerFromGoogleSheets());
  }, [dispatch]);

  const { bills, stockLedger, customers } = useSelector((state: RootState) => state.billing);

  const isInPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    if (period === 'today') return d.toDateString() === now.toDateString();
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const allPayments = bills.flatMap(b =>
    (b.paymentHistory || []).map(p => ({ ...p, billId: b.id }))
  );
  const periodPayments = allPayments.filter(p => isInPeriod(p.date));
  const cashTotal = periodPayments.filter(p => !p.method || p.method === 'Cash').reduce((s, p) => s + Number(p.amount), 0);
  const onlineTotal = periodPayments.filter(p => p.method === 'Online').reduce((s, p) => s + Number(p.amount), 0);
  const totalCollected = cashTotal + onlineTotal;

  const uniqueParties = (customers || []).length;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const billsToday = bills.filter(b => b.date === today).length;

  const getCalculatedPendingAmount = (b: any) => {
    const paidInHistory = (b.paymentHistory || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    return Math.max(0, (Number(b.grandTotal) || Number(b.amount) || 0) - paidInHistory);
  };
  const totalPending = bills.reduce((sum, b) => sum + getCalculatedPendingAmount(b), 0);

  const totalStocks = (stockLedger || []).reduce((acc, curr) =>
    curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning 👋';
    if (h < 17) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#F4F6F9" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
          <Ionicons name="menu" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.headerTitle}>SS&CO Explosives</Text>
        </View>
      </View>

      <View style={styles.body}>

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(drawer)/pending-payments')} activeOpacity={0.8}>
            <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            </View>
            <Text style={styles.statValue}>₹{totalPending.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Pending</Text>
            <Text style={styles.statHint}>Tap to view →</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="document-text-outline" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.statValue}>{billsToday}</Text>
            <Text style={styles.statLabel}>Bills Today</Text>
            <Text style={styles.statHint}>Invoices raised</Text>
          </View>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(drawer)/parties')} activeOpacity={0.8}>
            <View style={[styles.iconBadge, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="people-outline" size={18} color="#059669" />
            </View>
            <Text style={styles.statValue}>{uniqueParties}</Text>
            <Text style={styles.statLabel}>Total Parties</Text>
            <Text style={styles.statHint}>Tap to view →</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cube-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.statValue}>{totalStocks}</Text>
            <Text style={styles.statLabel}>Stock in Hand</Text>
            <Text style={styles.statHint}>Boxes available</Text>
          </View>
        </View>

        {/* Collection Summary */}
        <View style={styles.collectionSection}>
          <Text style={styles.sectionTitle}>Collection Summary</Text>

          {/* Period Tabs */}
          <View style={styles.periodRow}>
            {(['today', 'week', 'month'] as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total Banner */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalBannerLabel}>Total Collected · {periodLabel}</Text>
            <Text style={styles.totalBannerValue}>₹{totalCollected.toFixed(0)}</Text>
          </View>

          {/* Cash / Online */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownIconRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="cash-outline" size={16} color="#059669" />
                </View>
                <Text style={styles.breakdownMethod}>Cash</Text>
              </View>
              <Text style={styles.breakdownAmount}>₹{cashTotal.toFixed(0)}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownIconRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="card-outline" size={16} color="#4F46E5" />
                </View>
                <Text style={styles.breakdownMethod}>Online</Text>
              </View>
              <Text style={styles.breakdownAmount}>₹{onlineTotal.toFixed(0)}</Text>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F9' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EAECF0',
  },
  menuBtn: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#F4F6F9', alignItems: 'center', justifyContent: 'center',
  },
  greeting: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  body: { flex: 1, padding: 14, gap: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EAECF0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  iconBadge: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 3 },
  statHint: { fontSize: 10, color: '#9CA3AF' },

  collectionSection: {
    flex: 1,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EAECF0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },

  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  periodBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 8,
    alignItems: 'center', borderWidth: 1.5,
    borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  periodBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  periodBtnText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  periodBtnTextActive: { color: '#FFFFFF' },

  totalBanner: {
    backgroundColor: '#1F2937', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
  },
  totalBannerLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  totalBannerValue: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },

  breakdownRow: {
    flex: 1, flexDirection: 'row',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1, borderColor: '#EAECF0', overflow: 'hidden',
  },
  breakdownCard: { flex: 1, padding: 12 },
  breakdownIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  breakdownMethod: { fontSize: 12, fontWeight: '600', color: '#374151' },
  breakdownAmount: { fontSize: 18, fontWeight: '800', color: '#111827' },
  breakdownDivider: { width: 1, backgroundColor: '#EAECF0' },
});
