import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import { fetchCustomersFromGoogleSheets, fetchBillsFromGoogleSheets, Customer } from '../../../redux/billSlice';

export default function PartiesScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { customers, bills, status } = useSelector((state: RootState) => state.billing);
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchCustomersFromGoogleSheets());
    dispatch(fetchBillsFromGoogleSheets());
  }, [dispatch]);

  const getPartyStats = (customerName: string) => {
    const partyBills = bills.filter(
      b => b.customerName?.trim().toLowerCase() === customerName.trim().toLowerCase()
    );
    const totalBilled = partyBills.reduce((s, b) => s + (Number(b.grandTotal) || Number(b.amount) || 0), 0);
    const totalPaid = partyBills.reduce((s, b) => {
      const paid = (b.paymentHistory || []).reduce((ps, p) => ps + Number(p.amount), 0);
      return s + paid;
    }, 0);
    const totalPending = Math.max(0, totalBilled - totalPaid);
    return { billCount: partyBills.length, totalBilled, totalPaid, totalPending };
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const stats = getPartyStats(item.name);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/(drawer)/parties/[id]', params: { id: item.id, name: item.name } })}
        activeOpacity={0.7}
      >
        {/* Top Row: Avatar & Due Badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Ionicons name="business-outline" size={20} color="#1F2937" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {stats.totalPending > 0 ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>₹{stats.totalPending.toFixed(0)} due</Text>
              </View>
            ) : stats.billCount > 0 ? (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>Cleared</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>

        {/* Next Line: Name */}
        <Text style={styles.partyName}>{item.name}</Text>
        
        {/* Next Line: Phone */}
        <Text style={styles.partyPhone}>{item.phone || 'No phone'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parties</Text>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')}>
          <Ionicons name="speedometer-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {isLoading && customers.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading parties...</Text>
        </View>
      ) : (
        <FlatList
          data={customers || []}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                dispatch(fetchCustomersFromGoogleSheets());
                dispatch(fetchBillsFromGoogleSheets());
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No parties yet.</Text>
              <Text style={styles.emptySubText}>Add parties from the side menu → Add Party</Text>
            </View>
          }
        />
      )}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  partyName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  partyPhone: { fontSize: 14, color: '#6B7280' },
  pendingBadge: {
    backgroundColor: '#FEF2F2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  paidBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  paidBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  emptySubText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40 },
});
