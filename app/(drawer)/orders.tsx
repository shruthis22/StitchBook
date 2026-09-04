import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrdersScreen() {
  const router = useRouter();
  const { initialFilter } = useLocalSearchParams();
  const [filter, setFilter] = useState(initialFilter ? String(initialFilter) : 'All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expose special filters generated from dashboard
  const filters = ['All', 'Today', 'Overdue', 'InProgress', 'Working', 'Ready', 'Alter', 'Delivered'];

  useEffect(() => {
    if (initialFilter) setFilter(String(initialFilter));
  }, [initialFilter]);

  const orders = useSelector((state: any) => state.stitchbook.orders);
  const customers = useSelector((state: any) => state.stitchbook.customers);

  const getCustomerName = (id: string) => {
    const cust = customers.find((c: any) => c.customer_id === id);
    return cust ? cust.name : id;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    if (dateStr.length < 12 && !dateStr.includes('T')) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return '#4CAF50';
      case 'Alter': return '#E53935';
      case 'Delivered': return '#9E9E9E';
      case 'Working':
      default: return '#F57C00';
    }
  };

  const getOrderDescription = (orderTypeStr: string) => {
    try {
      const items = JSON.parse(orderTypeStr);
      return items.map((i: any) => i.description).join(', ');
    } catch {
      return orderTypeStr;
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    let matchesFilter = false;
    
    if (filter === 'All') {
      matchesFilter = true;
    } else if (filter === 'Today') {
      if (o.delivery_date && o.status !== 'Delivered') {
         const d = new Date(o.delivery_date);
         d.setHours(0,0,0,0);
         const t = new Date(); t.setHours(0,0,0,0);
         matchesFilter = (d.getTime() === t.getTime());
      }
    } else if (filter === 'Overdue') {
      if (o.delivery_date && o.status !== 'Delivered') {
         const d = new Date(o.delivery_date);
         d.setHours(0,0,0,0);
         const t = new Date(); t.setHours(0,0,0,0);
         matchesFilter = (d.getTime() < t.getTime());
      }
    } else if (filter === 'InProgress') {
      matchesFilter = (o.status !== 'Ready' && o.status !== 'Delivered');
    } else {
      matchesFilter = (o.status === filter);
    }

    const custName = getCustomerName(o.customer_id).toLowerCase();
    const matchesSearch = o.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          custName.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderOrder = ({ item }: any) => (
    <TouchableOpacity style={[styles.card, { borderLeftColor: getStatusColor(item.status) }]} onPress={() => router.push(`/order/${item.order_id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{getCustomerName(item.customer_id)}</Text>
        <Text style={styles.orderId}>{item.order_id}</Text>
      </View>
      <Text style={styles.orderType} numberOfLines={1}>{getOrderDescription(item.order_type)}</Text>
      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
        <Text style={styles.deliveryText}>Due: {formatDate(item.delivery_date)}</Text>
        <Text style={styles.balanceText}>Bal: ₹{item.balance}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search by customer or Order ID..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.order_id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 15, marginBottom: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#E6E2DD', paddingHorizontal: 10
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  filterWrapper: { height: 50, marginBottom: 10 },
  filterScroll: { paddingHorizontal: 15, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 15, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#E6E2DD', marginRight: 10,
  },
  filterChipActive: { backgroundColor: '#4A3B32' },
  filterText: { color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  orderId: { fontSize: 14, color: '#888' },
  orderType: { fontSize: 15, color: '#666', marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#1976D2', fontWeight: 'bold', fontSize: 12 },
  deliveryText: { fontSize: 13, color: '#D32F2F', fontWeight: '500' },
  balanceText: { fontSize: 14, fontWeight: 'bold', color: '#388E3C' },
});
