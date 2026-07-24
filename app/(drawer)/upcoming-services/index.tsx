import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
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

const parseServiceDate = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function UpcomingServicesScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const navigation = useNavigation();
  const { bills, status } = useSelector((state: RootState) => state.billing);

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

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

  const handleMarkCompleted = (id: string) => {
    dispatch(updateBillInGoogleSheets({ id, updates: { nextServiceDate: '' } }));
  };

  const handleEditDate = (bill: Bill) => {
    setEditingBillId(bill.id);
    setPickerDate(bill.nextServiceDate ? parseServiceDate(bill.nextServiceDate) : new Date());
    setShowPicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate && editingBillId) {
      setPickerDate(selectedDate);
      const isoDate = selectedDate.toISOString();
      dispatch(updateBillInGoogleSheets({ id: editingBillId, updates: { nextServiceDate: isoDate } }));
      setEditingBillId(null);
      setShowPicker(false);
    } else {
      setEditingBillId(null);
    }
  };
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingBills = useMemo(() => {
    return bills
      .filter(bill => bill.nextServiceDate && String(bill.nextServiceDate).trim() !== '')
      .filter(bill => {
        const q = search.toLowerCase();
        return (
          String(bill.customerName || '').toLowerCase().includes(q) ||
          String(bill.vehicleNumber || '').toLowerCase().includes(q) ||
          String(bill.vehicleName || '').toLowerCase().includes(q) ||
          String(bill.id || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dateA = parseServiceDate(a.nextServiceDate!);
        const dateB = parseServiceDate(b.nextServiceDate!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [bills, search]);

  const renderItem = ({ item }: { item: Bill }) => {
    const serviceDate = parseServiceDate(item.nextServiceDate!);
    const isOverdue = serviceDate < today;
    const isToday = serviceDate.getTime() === today.getTime();

    return (
      <TouchableOpacity
        style={styles.card}
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
            <Text style={styles.vehicleInfo}>
              {item.vehicleName ? `${item.vehicleName} • ` : ''}{item.vehicleNumber || 'N/A'}
            </Text>
          </View>
          <View style={[
            styles.dateBadge,
            isOverdue && styles.overdueBadge,
            isToday && styles.todayBadge,
          ]}>
            <Ionicons
              name="calendar"
              size={14}
              color={isOverdue ? '#DC2626' : isToday ? '#D97706' : '#2563EB'}
            />
            <Text style={[
              styles.dateBadgeText,
              isOverdue && styles.overdueText,
              isToday && styles.todayText,
            ]}>
              {formatDate(item.nextServiceDate!)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.invoiceInfo}>Invoice {item.id} • Last visit {formatDate(item.date)}</Text>
          {isOverdue && (
            <View style={styles.overdueTag}>
              <Text style={styles.overdueTagText}>Overdue</Text>
            </View>
          )}
          {isToday && (
            <View style={styles.todayTag}>
              <Text style={styles.todayTagText}>Today</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditDate(item)}
          >
            <Ionicons name="pencil" size={16} color="#4B5563" />
            <Text style={styles.actionButtonText}>Edit Date</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleMarkCompleted(item.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={styles.completeButtonText}>Completed</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upcoming Services</Text>
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
          <Text style={styles.hintText}>
            Bills with a next service date appear here. Older bills without a date are not affected.
          </Text>
        </View>

        {status === 'loading' && bills.length === 0 && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={upcomingBills}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id + '-' + index}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24 }}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
                  No upcoming services scheduled. Set a next service date when creating a bill.
                </Text>
              </View>
            }
          />
        )}
        
        {showPicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
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
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  dateBadgeText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  overdueBadge: { backgroundColor: '#FEE2E2' },
  overdueText: { color: '#DC2626' },
  todayBadge: { backgroundColor: '#FEF3C7' },
  todayText: { color: '#D97706' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  invoiceInfo: { fontSize: 13, color: '#6B7280' },
  overdueTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overdueTagText: { fontSize: 11, fontWeight: '600', color: '#DC2626' },
  todayTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayTagText: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  completeButton: {
    backgroundColor: '#D1FAE5',
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },
});
