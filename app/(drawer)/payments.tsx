import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { addPaymentLocal, updateOrderPaymentLocal } from '../../redux/stitchbookSlice';
import { addPayment } from '../../utils/api';

export default function PaymentsScreen() {
  const dispatch = useDispatch();
  const orders = useSelector((state: any) => state.stitchbook.orders);
  const customers = useSelector((state: any) => state.stitchbook.customers);

  // Filter orders with active balances
  const pendingOrders = orders.filter((o: any) => Number(o.balance) > 0);
  
  const totalPending = pendingOrders.reduce((sum: number, o: any) => sum + Number(o.balance), 0);

  const getCustomerName = (id: string) => {
    const c = customers.find((cust: any) => cust.customer_id === id);
    return c ? c.name : 'Unknown';
  };

  const handleAddPayment = (order: any) => {
    Alert.alert(
      "Mark as Fully Paid",
      `Are you sure you want to collect the remaining balance of ₹${order.balance} for ${getCustomerName(order.customer_id)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Collect Full Balance", 
          onPress: async () => {
            try {
              const res = await addPayment({
                order_id: order.order_id,
                customer_id: order.customer_id,
                amount: order.balance,
                payment_mode: 'Cash'
              });
              if(res.status === 'success') {
                dispatch(updateOrderPaymentLocal({ order_id: order.order_id, amount: order.balance }));
                Alert.alert("Success", "Payment recorded successfully!");
              }
            } catch (e) {
              Alert.alert("Error", "Failed to record payment.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.customerName}>{getCustomerName(item.customer_id)}</Text>
          <Text style={styles.orderId}>{item.order_id}</Text>
        </View>
        <TouchableOpacity style={styles.addPaymentBtn} onPress={() => handleAddPayment(item)}>
          <MaterialIcons name="add" size={16} color="#fff" />
          <Text style={styles.addPaymentText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>₹{item.total_amount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Paid</Text>
          <Text style={[styles.statValue, { color: '#1976D2' }]}>₹{item.total_paid}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={[styles.statValue, { color: '#D32F2F' }]}>₹{item.balance}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Pending Payments</Text>
        <Text style={styles.summaryAmount}>₹{totalPending}</Text>
      </View>

      <FlatList
        data={pendingOrders}
        keyExtractor={item => item.order_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  summaryCard: {
    backgroundColor: '#4A3B32', margin: 15, padding: 25, borderRadius: 12,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  summaryTitle: { color: '#E6E2DD', fontSize: 14, marginBottom: 5, letterSpacing: 1 },
  summaryAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  list: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  orderId: { fontSize: 14, color: '#888' },
  addPaymentBtn: { 
    backgroundColor: '#388E3C', flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 
  },
  addPaymentText: { color: '#fff', fontWeight: 'bold', marginLeft: 4, fontSize: 12 },
  divider: { height: 1, backgroundColor: '#E6E2DD', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});
