import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';

export default function DashboardScreen() {
  const router = useRouter();
  const orders = useSelector((state: any) => state.stitchbook.orders);
  const customers = useSelector((state: any) => state.stitchbook.customers);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const todayStr = new Date().toDateString(); // Simplified for matching
  const todayISO = new Date().toISOString().split('T')[0];

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

  // Calculate metrics
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const deliveriesToday = orders.filter((o: any) => {
    if (!o.delivery_date || o.status === 'Delivered') return false;
    const d = new Date(o.delivery_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === todayDate.getTime();
  }).length;

  const overdueOrders = orders.filter((o: any) => {
    if (!o.delivery_date || o.status === 'Delivered') return false;
    const d = new Date(o.delivery_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < todayDate.getTime();
  }).length;

  const readyOrders = orders.filter((o: any) => o.status === 'Ready').length;
  const inProgressOrders = orders.filter((o: any) => o.status !== 'Ready' && o.status !== 'Delivered').length;

  const upcomingOrders = [...orders]
    .filter((o: any) => o.status !== 'Delivered' && o.delivery_date)
    .sort((a: any, b: any) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
    .slice(0, 5);

  const getOrderDescription = (orderTypeStr: string) => {
    try {
      const items = JSON.parse(orderTypeStr);
      return items.map((i: any) => i.description).join(', ');
    } catch {
      return orderTypeStr;
    }
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#EAE3DC']} style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Boutique Owner</Text>
          <Text style={styles.date}>{todayStr}</Text>
        </View>

        <Animated.View style={[styles.metricsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(drawer)/orders?initialFilter=Today')}>
            <View style={styles.iconContainer}>
              <Feather name="truck" size={22} color="#4A3B32" />
            </View>
            <Text style={styles.metricValue}>{deliveriesToday}</Text>
            <Text style={styles.metricLabel}>Deliveries Today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(drawer)/orders?initialFilter=Overdue')}>
            <View style={styles.iconContainer}>
              <Feather name="alert-triangle" size={22} color="#E53935" />
            </View>
            <Text style={[styles.metricValue, { color: '#E53935' }]}>{overdueOrders}</Text>
            <Text style={styles.metricLabel}>Overdue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(drawer)/orders?initialFilter=Ready')}>
            <View style={styles.iconContainer}>
              <Feather name="check-circle" size={22} color="#4CAF50" />
            </View>
            <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{readyOrders}</Text>
            <Text style={styles.metricLabel}>Ready</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(drawer)/orders?initialFilter=InProgress')}>
            <View style={styles.iconContainer}>
              <Feather name="scissors" size={22} color="#4A3B32" />
            </View>
            <Text style={styles.metricValue}>{inProgressOrders}</Text>
            <Text style={styles.metricLabel}>In Progress</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          onPress={() => router.push('/(drawer)/new-order')}
        >
          <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
            style={styles.newOrderBtn}
          >
            <MaterialIcons name="add" size={20} color="#FFF" />
            <Text style={styles.newOrderBtnText}>NEW ORDER</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Upcoming Deliveries</Text>
        
        {upcomingOrders.length === 0 ? (
          <Text style={{ marginHorizontal: 20, color: '#888' }}>No upcoming orders.</Text>
        ) : (
          upcomingOrders.map((o: any) => (
            <TouchableOpacity key={o.order_id} style={[styles.orderCard, { borderLeftColor: getStatusColor(o.status) }]} onPress={() => router.push(`/order/${o.order_id}`)}>
              <View style={styles.orderHeader}>
                <Text style={styles.customerName}>{getCustomerName(o.customer_id)}</Text>
                <Text style={styles.orderId}>{o.order_id}</Text>
              </View>
              <Text style={styles.orderType} numberOfLines={1}>{getOrderDescription(o.order_type)}</Text>
              <View style={styles.orderFooter}>
                <Text style={styles.deliveryDate}>Delivery: {formatDate(o.delivery_date)}</Text>
                <Text style={[styles.statusBadge, { color: getStatusColor(o.status), backgroundColor: getStatusColor(o.status) + '1A' }]}>{o.status}</Text>
                <Text style={styles.balance}>Bal: ₹{o.balance}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { padding: 20, paddingBottom: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#4A3B32' },
  date: { fontSize: 14, color: '#6B5B52', marginTop: 5 },
  metricsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 0, justifyContent: 'space-between' },
  metricCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 8,
    width: '48%', 
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E2DD',
    shadowColor: '#4A3B32', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2
  },
  iconContainer: { 
    marginBottom: 4,
    opacity: 0.9
  },
  metricValue: { fontSize: 20, fontWeight: '900', color: '#4A3B32' },
  metricLabel: { fontSize: 12, fontWeight: '600', color: '#666', textAlign: 'center', marginTop: 2 },
  newOrderBtn: {
    marginHorizontal: 20,
    marginTop: 8, 
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#4A3B32', 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  newOrderBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800', 
    marginLeft: 8, 
    letterSpacing: 1.5,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#4A3B32', marginHorizontal: 20, marginTop: 25, marginBottom: 10 },
  orderCard: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, padding: 15, marginBottom: 15,
    borderLeftWidth: 4, borderLeftColor: '#F57C00',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderId: { fontSize: 12, color: '#888' },
  orderType: { fontSize: 14, color: '#666', marginBottom: 15 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deliveryDate: { fontSize: 12, color: '#D32F2F', fontWeight: '500' },
  statusBadge: { backgroundColor: '#E3F2FD', color: '#1976D2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
  balance: { fontSize: 14, fontWeight: 'bold', color: '#388E3C' }
});
