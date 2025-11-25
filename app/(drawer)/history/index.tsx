import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Bill } from "../../../redux/billSlice";
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';



const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid': return { bg: '#D1FAE5', text: '#059669' };
    case 'Pending': return { bg: '#FEF3C7', text: '#D97706' };
    case 'Overdue': return { bg: '#FEE2E2', text: '#DC2626' };
    default: return { bg: '#E5E7EB', text: '#374151' };
  }
};





export default function BillingHistoryScreen() {



  const bills = useSelector((state: RootState) => state.billing.bills);
  const router = useRouter();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Pending'>('All');


  const filteredBills = bills.filter(bill =>
    (filter === 'All' || bill.status === filter) &&
    (bill.customerName.toLowerCase().includes(search.toLowerCase()) ||
      bill.vehicleNumber.toLowerCase().includes(search.toLowerCase()))
  );




  const renderItem = ({ item }: { item: Bill }) => {


    const statusStyle = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          // FIX: Use object syntax to handle special characters like '#' in IDs
          router.push({
            pathname: '/(drawer)/history/[id]',
            params: { id: item.id }
          });

          // ALTERNATIVE FIX (If using string path):
          // router.push(`/(drawer)/history/${encodeURIComponent(item.id)}`);
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
            placeholder="Search by Name, Phone, Vehicle..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />

        </View>



        <View style={styles.chipsContainer}>

          <TouchableOpacity style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={16} color="#374151" />
            <Text style={styles.chipText}>Date Range</Text>
          </TouchableOpacity>


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



      <FlatList
        data={filteredBills}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6'
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
    //paddingVertical: 10, 
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
    padding: 16
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
    marginTop: 12 
  },
  dateChip: {
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#D1D5DB',
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    marginRight: 8
  },
  filterChip: {
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 20,
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    marginRight: 8, 
    backgroundColor: '#FFF'
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
    fontWeight: '500' 
  },

});