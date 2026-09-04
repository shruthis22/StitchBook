import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const customer = useSelector((state: any) => state.stitchbook.customers.find((c: any) => c.customer_id === id));
  const customerOrders = useSelector((state: any) => state.stitchbook.orders.filter((o: any) => o.customer_id === id));

  if (!customer) {
    return <SafeAreaView style={styles.container}><View style={styles.container}><Text>Customer not found</Text></View></SafeAreaView>;
  }

  // Get latest measurements from their most recent order
  const latestOrder = customerOrders[0];
  let advMeasurements: any = {};
  if (latestOrder) {
    try {
      if (latestOrder.measurement_notes) {
        advMeasurements = JSON.parse(latestOrder.measurement_notes);
      }
    } catch (e) {
      advMeasurements = { notes: latestOrder.measurement_notes };
    }
  }

  const getOrderDescription = (orderTypeStr: string) => {
    try {
      const items = JSON.parse(orderTypeStr);
      return items.map((i: any) => i.description).join(', ');
    } catch {
      return orderTypeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const renderOrder = (item: any) => (
    <TouchableOpacity key={item.order_id} style={styles.orderCard} onPress={() => router.push(`/order/${item.order_id}`)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.orderType, { flex: 1, marginRight: 10 }]} numberOfLines={1} ellipsizeMode="tail">{getOrderDescription(item.order_type)}</Text>
        <Text style={styles.orderAmount}>₹{item.total_amount}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'flex-end' }}>
        <View>
          <Text style={[styles.subText, { fontSize: 12, marginBottom: 2 }]}>Ordered: {formatDate(item.order_date || item.created_at)}</Text>
          <Text style={[styles.subText, { fontSize: 12, color: '#D32F2F' }]}>Delivery: {item.delivery_date || 'Not set'}</Text>
        </View>
        <Text style={[styles.subText, { color: '#1976D2', fontWeight: 'bold' }]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4A3B32' }}>
      <ScrollView style={styles.container}>
        <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFF' }]}>Customer Profile</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LATEST MEASUREMENTS</Text>
          {latestOrder ? (
            <View>
              <View style={styles.row}>
                <Text style={styles.measureText}>Length: {advMeasurements.length || '-'}</Text>
                <Text style={styles.measureText}>Shoulder: {latestOrder.shoulder || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.measureText}>Bust: {latestOrder.bust || '-'}</Text>
                <Text style={styles.measureText}>Underbust: {advMeasurements.underbust || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.measureText}>Waist: {latestOrder.waist || '-'}</Text>
                <Text style={styles.measureText}>Hip: {advMeasurements.hip || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.measureText}>Armhole: {latestOrder.armhole || '-'}</Text>
                <Text style={styles.measureText}>Sleeve: {latestOrder.sleeve_length || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.measureText}>Pant Length: {advMeasurements.pant_length || '-'}</Text>
                <Text style={styles.measureText}>Front Neck: {latestOrder.front_neck || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.measureText}>Back Neck: {latestOrder.back_neck || '-'}</Text>
                <Text style={styles.measureText}></Text>
              </View>
            </View>
          ) : (
            <Text style={styles.subText}>No measurements found.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER HISTORY</Text>
          {customerOrders.length > 0 ? (
            customerOrders.map((o: any) => renderOrder(o))
          ) : (
            <Text style={styles.subText}>No orders yet.</Text>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  profileHeader: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E6E2DD' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4A3B32', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  phone: { fontSize: 16, color: '#666', marginTop: 5 },
  section: { backgroundColor: '#fff', padding: 20, marginTop: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E6E2DD' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', letterSpacing: 1, marginBottom: 15 },
  row: { flexDirection: 'row', marginBottom: 10 },
  measureText: { flex: 1, fontSize: 16, color: '#4A3B32' },
  subText: { fontSize: 14, color: '#666' },
  orderCard: { backgroundColor: '#FAF9F6', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E6E2DD' },
  orderType: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  orderAmount: { fontSize: 16, fontWeight: 'bold', color: '#388E3C' },
});
