import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { updateOrderStatus, addPayment, deleteOrder } from '../../utils/api';
import { updateOrderStatusLocal, updateOrderPaymentLocal, deleteOrderLocal } from '../../redux/stitchbookSlice';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const order = useSelector((state: any) => state.stitchbook.orders.find((o: any) => o.order_id === id));
  const customer = useSelector((state: any) => state.stitchbook.customers.find((c: any) => c.customer_id === order?.customer_id));

  if (!order || !customer) {
    return <View style={styles.container}><Text>Order not found</Text></View>;
  }

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await updateOrderStatus(order.order_id, newStatus);
      if (res.status === 'success') {
        dispatch(updateOrderStatusLocal({ order_id: id, status: newStatus }));
        Alert.alert("Success", `Status updated to ${newStatus}`);
      } else {
        Alert.alert("Error", "Failed to update status");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = () => {
    Alert.alert("Change Status", "Select a new status:", [
      { text: "Working", onPress: () => updateStatus('Working') },
      { text: "Ready", onPress: () => updateStatus('Ready') },
      { text: "Alter", onPress: () => updateStatus('Alter') },
      { text: "Delivered", onPress: () => updateStatus('Delivered') },
      { text: "Cancel", style: 'cancel' }
    ]);
  };

  const handleAddPayment = () => {
    if (Number(order.balance) <= 0) {
      Alert.alert("Notice", "This order is already fully paid.");
      return;
    }
    Alert.alert("Collect Payment", `Collect remaining balance of ₹${order.balance}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Collect Full", onPress: async () => {
          setLoading(true);
          try {
            const res = await addPayment({ order_id: order.order_id, customer_id: order.customer_id, amount: order.balance, payment_mode: 'Cash' });
            if (res.status === 'success') {
              dispatch(updateOrderPaymentLocal({ order_id: order.order_id, amount: order.balance }));
              Alert.alert("Success", "Payment recorded successfully!");
            }
          } catch (e) {
            Alert.alert("Error", "Failed to record payment");
          } finally {
            setLoading(false);
          }
      }}
    ]);
  };

  const handleDeleteOrder = () => {
    Alert.alert("Delete Order", "Are you sure you want to permanently delete this order? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setLoading(true);
          try {
            const res = await deleteOrder(order.order_id);
            if (res.status === 'success') {
              dispatch(deleteOrderLocal(order.order_id));
              Alert.alert("Deleted", "Order has been deleted.");
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete order from backend.");
            }
          } catch (e) {
            Alert.alert("Error", "Something went wrong.");
          } finally {
            setLoading(false);
          }
      }}
    ]);
  };

  const generateInvoice = () => {
    router.push(`/invoice/${id}`);
  };

  let orderItems = [];
  try {
    orderItems = JSON.parse(order.order_type);
  } catch (e) {
    orderItems = [{ description: order.order_type, price: order.total_amount }];
  }

  let advancedMeasurements: any = {};
  try {
    if (order.measurement_notes) {
      advancedMeasurements = JSON.parse(order.measurement_notes);
    }
  } catch (e) {
    advancedMeasurements = { notes: order.measurement_notes };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4A3B32' }}>
      <ScrollView style={styles.container}>
      {loading && <View style={{ padding: 10, backgroundColor: '#eee' }}><Text>Updating...</Text></View>}
      <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFF' }]}>Order {id}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CUSTOMER</Text>
        <Text style={styles.detailText}>{customer.name}</Text>
        <Text style={styles.subText}>{customer.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
        {orderItems.map((item: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={{ fontSize: 16, color: '#333' }}>{item.description}</Text>
            <Text style={{ fontSize: 16, color: '#4A3B32', fontWeight: 'bold' }}>₹{item.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STATUS</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MEASUREMENTS</Text>
        <View style={styles.row}>
          <Text style={styles.measureText}>Length: {advancedMeasurements.length || '-'}</Text>
          <Text style={styles.measureText}>Shoulder: {order.shoulder || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.measureText}>Bust: {order.bust || '-'}</Text>
          <Text style={styles.measureText}>Underbust: {advancedMeasurements.underbust || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.measureText}>Waist: {order.waist || '-'}</Text>
          <Text style={styles.measureText}>Hip: {advancedMeasurements.hip || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.measureText}>Armhole: {order.armhole || '-'}</Text>
          <Text style={styles.measureText}>Sleeve: {order.sleeve_length || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.measureText}>Pant Length: {advancedMeasurements.pant_length || '-'}</Text>
          <Text style={styles.measureText}>Front Neck: {order.front_neck || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.measureText}>Back Neck: {order.back_neck || '-'}</Text>
          <Text style={styles.measureText}></Text>
        </View>
        {advancedMeasurements.notes ? (
          <View style={{ marginTop: 15, padding: 10, backgroundColor: '#FAF9F6', borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>Notes: {advancedMeasurements.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESIGN PHOTOS</Text>
        {order.design_photo_ids ? (
           order.design_photo_ids.split(',').map((url: string, i: number) => (
             <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FAF9F6', marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E6E2DD' }}>
               <MaterialIcons name="image" size={24} color="#4A3B32" />
               <Text style={{ marginLeft: 10, color: '#1976D2', fontWeight: 'bold' }}>View Uploaded Photo {i + 1}</Text>
             </TouchableOpacity>
           ))
        ) : <Text style={styles.subText}>No photos uploaded.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PAYMENT</Text>
        <View style={styles.rowBtw}>
          <Text style={styles.subText}>Total:</Text>
          <Text style={styles.detailText}>₹{order.total_amount}</Text>
        </View>
        <View style={styles.rowBtw}>
          <Text style={styles.subText}>Paid:</Text>
          <Text style={[styles.detailText, { color: '#1976D2' }]}>₹{order.total_paid}</Text>
        </View>
        <View style={styles.rowBtw}>
          <Text style={styles.subText}>Balance:</Text>
          <Text style={[styles.detailText, { color: '#D32F2F' }]}>₹{order.balance}</Text>
        </View>
        <TouchableOpacity style={[styles.btnOutline, { marginTop: 15 }]} onPress={handleAddPayment}>
          <Text style={styles.btnOutlineText}>Add Payment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.btnOutline} onPress={handleChangeStatus}>
          <Text style={styles.btnOutlineText}>Change Status</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={generateInvoice} style={{ marginBottom: 15 }}>
          <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 15, borderRadius: 8, alignItems: 'center' }}>
            <Text style={styles.btnSolidText}>Generate Invoice</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnOutline, { borderColor: '#D32F2F', marginTop: 5 }]} onPress={handleDeleteOrder}>
          <Text style={[styles.btnOutlineText, { color: '#D32F2F' }]}>Delete Order</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E6E2DD' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3B32' },
  section: { backgroundColor: '#fff', padding: 20, marginTop: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E6E2DD' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', letterSpacing: 1, marginBottom: 10 },
  detailText: { fontSize: 18, fontWeight: '500', color: '#333' },
  subText: { fontSize: 14, color: '#666', marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  statusText: { color: '#1976D2', fontWeight: 'bold', fontSize: 14 },
  row: { flexDirection: 'row', marginTop: 10 },
  measureText: { flex: 1, fontSize: 16, color: '#4A3B32' },
  rowBtw: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  actionsContainer: { padding: 20 },
  btnSolid: { backgroundColor: '#4A3B32', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnSolidText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnOutline: { backgroundColor: 'transparent', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#4A3B32' },
  btnOutlineText: { color: '#4A3B32', fontSize: 16, fontWeight: 'bold' }
});
