import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../redux/store';
import { Bill, fetchBillsFromGoogleSheets } from "../../../redux/billSlice";
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker'; 





// Helper to parse "30 Nov 2025" into a JS Date object
const parseDateString = (dateStr: string) => {
  return new Date(dateStr);
};




const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid': return { bg: '#D1FAE5', text: '#059669' };
    case 'Pending': return { bg: '#FEF3C7', text: '#D97706' };
    case 'Overdue': return { bg: '#FEE2E2', text: '#DC2626' };
    default: return { bg: '#E5E7EB', text: '#374151' };
  }
};






export default function BillingHistoryScreen() {




  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const navigation = useNavigation();

  const { bills, status } = useSelector((state: RootState) => state.billing);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [refreshing, setRefreshing] = useState(false);



  // <--- CHANGED: Date Range State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');





  useEffect(() => {
    dispatch(fetchBillsFromGoogleSheets());
  }, [dispatch]);





  const onRefresh = useCallback(async () => {

    setRefreshing(true);

    try 
    {

      await dispatch(fetchBillsFromGoogleSheets()).unwrap();

    } 
    catch (error) 
    {
      console.error("Refresh failed", error);
    } 
    finally 
    {
      setRefreshing(false);
    }
  }, [dispatch]);






  
  const showDatePicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setShowPicker(true);
  };




  const onDateChange = (event: any, selectedDate?: Date) => {


    // Hide picker immediately on Android
    if (Platform.OS === 'android') setShowPicker(false);

    if (selectedDate) {

      if (pickerMode === 'start') {
        setStartDate(selectedDate);
        // After picking start date, automatically prompt for end date (Optional UX)
        // setTimeout(() => showDatePicker('end'), 500); 
      } else {
        // Set end date to end of that day
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        setEndDate(endOfDay);
      }
    }
  };



  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };





  // <--- CHANGED: Filtering Logic
  const filteredBills = bills.filter(bill => {


    // 1. Text Search Filter
    const matchesSearch =
      bill.customerName.toLowerCase().includes(search.toLowerCase()) ||
      bill.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      bill.id.toLowerCase().includes(search.toLowerCase());

    // 2. Status Filter
    const matchesStatus = filter === 'All' || bill.status === filter;

    // 3. Date Range Filter
    let matchesDate = true;
    if (startDate || endDate) {
      const billDate = parseDateString(bill.date);
      if (startDate && billDate < startDate) matchesDate = false;
      if (endDate && billDate > endDate) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });






  const renderItem = ({ item }: { item: Bill }) => {


    const statusStyle = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/(drawer)/history/[id]',
            params: { id: item.id }
          });
        }}
      >

        <View style={styles.row}>
          <View>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.vehicleInfo}>{item.vehicleNumber}</Text>
          </View>
          <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
        </View>

        <View style={[styles.divider]} />

        <View style={styles.row}>
          <Text style={styles.invoiceInfo}>Invoice {item.id} • {item.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>


      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>

        

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Billing History</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Name, Phone, Vehicle..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.chipsContainer}>


            {startDate || endDate ? (
              <TouchableOpacity style={[styles.dateChip, styles.activeChip]} onPress={clearDateFilter}>
                <Ionicons name="close-circle" size={16} color="#1E40AF" />
                <Text style={styles.activeChipText}>
                  {startDate ? startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Start'}
                  {' - '}
                  {endDate ? endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'End'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.dateChip} onPress={() => showDatePicker('start')}>
                <Ionicons name="calendar-outline" size={16} color="#374151" />
                <Text style={styles.chipText}>Date Range</Text>
              </TouchableOpacity>
            )}


            {startDate && !endDate && (
              <TouchableOpacity style={[styles.dateChip, { marginLeft: 0, backgroundColor: '#FEF3C7' }]} onPress={() => showDatePicker('end')}>
                <Text style={[styles.chipText, { color: '#D97706' }]}>+ Set End Date</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.filterChip, filter === 'Paid' && styles.activeChip]}
              onPress={() => setFilter(filter === 'Paid' ? 'All' : 'Paid')}
            >
              <Text style={[styles.chipText, filter === 'Paid' && styles.activeChipText]}>Paid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filter === 'Pending' && styles.activeChip]}
              onPress={() => setFilter(filter === 'Pending' ? 'All' : 'Pending')}
            >
              <Text style={[styles.chipText, filter === 'Pending' && styles.activeChipText]}>Pending</Text>
            </TouchableOpacity>
          </View>
        </View>


        {showPicker && (
          <DateTimePicker
            value={pickerMode === 'start' ? (startDate || new Date()) : (endDate || new Date())}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()} // Can't select future dates
          />
        )}

        {status === 'loading' && bills.length === 0 && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading bills...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBills}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Text style={{ color: '#9CA3AF' }}>No bills found.</Text>
                {(startDate || endDate) && <Text style={{ color: '#3B82F6', marginTop: 5 }} onPress={clearDateFilter}>Clear Date Filter</Text>}
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
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
  filterContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8
  },
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12
  },
  invoiceInfo: {
    fontSize: 13,
    color: '#6B7280'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  chipsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap' // Added to handle multiple date chips
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4 // Added for wrap spacing
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#FFF',
    marginBottom: 4 // Added for wrap spacing
  },
  activeChip: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6'
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 4
  },
  activeChipText: {
    color: '#1E40AF',
    fontWeight: '500',
    marginLeft: 4
  },
});