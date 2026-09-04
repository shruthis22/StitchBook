import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

export default function CustomersScreen() {
  const router = useRouter();
  const customers = useSelector((state: any) => state.stitchbook.customers);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((c: any) => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(c.phone || '').includes(searchQuery)
  );

  const renderCustomer = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/customer/${item.customer_id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.id}>{item.customer_id}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={16} color="#666" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
        <Text style={styles.dateText}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search customers by name or phone..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.customer_id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/(drawer)/new-order')}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 15, borderRadius: 8,
    borderWidth: 1, borderColor: '#E6E2DD', paddingHorizontal: 10
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16 },
  list: { paddingHorizontal: 15, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#4A3B32'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  id: { fontSize: 14, color: '#888' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 5, color: '#666', fontSize: 14 },
  dateText: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    backgroundColor: '#4A3B32', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
  }
});
