import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createOrder, createCustomer, uploadPhoto, addPayment } from '../../utils/api';
import { addOrderLocal, addCustomerLocal } from '../../redux/stitchbookSlice';
import { useRouter, useFocusEffect } from 'expo-router';

export default function NewOrderScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const customers = useSelector((state: any) => state.stitchbook.customers);
  
  const [loading, setLoading] = useState(false);

  // Customer State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Order Items State
  const [items, setItems] = useState([{ id: Date.now().toString(), description: 'Bridal Blouse', price: '' }]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObject, setDateObject] = useState(new Date());

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObject(selectedDate);
      setDeliveryDate(selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
  };
  
  // Measurements
  const [length, setLength] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [bust, setBust] = useState('');
  const [underbust, setUnderbust] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [armhole, setArmhole] = useState('');
  const [sleeveLength, setSleeveLength] = useState('');
  const [pantLength, setPantLength] = useState('');
  const [frontNeck, setFrontNeck] = useState('');
  const [backNeck, setBackNeck] = useState('');
  const [measurementNotes, setMeasurementNotes] = useState('');
  
  // Photos
  const [designPhotos, setDesignPhotos] = useState<string[]>([]);
  
  // Payment
  const [advancePayment, setAdvancePayment] = useState('');

  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      setSelectedCustomerId(null);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setItems([{ id: Date.now().toString(), description: 'Bridal Blouse', price: '' }]);
      setDeliveryDate('');
      setLength('');
      setBust('');
      setUnderbust('');
      setWaist('');
      setHip('');
      setShoulder('');
      setArmhole('');
      setSleeveLength('');
      setPantLength('');
      setFrontNeck('');
      setBackNeck('');
      setMeasurementNotes('');
      setDesignPhotos([]);
      setAdvancePayment('');
    }, [])
  );

  const orders = useSelector((state: any) => state.stitchbook.orders);

  // Computed Total
  const computedTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // Filtering Customers
  const filteredCustomers = searchQuery.length > 1 
    ? customers.filter((c: any) => 
        (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (String(c.phone || '').includes(searchQuery))
      )
    : [];

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomerId(c.customer_id);
    setCustomerName(String(c.name || ''));
    setPhone(String(c.phone || ''));
    setAddress(String(c.address || ''));
    setSearchQuery('');

    const custOrders = orders.filter((o: any) => o.customer_id === c.customer_id);
    const orderWithMeasurements = custOrders.find((o: any) => o.bust || o.waist || o.shoulder || o.front_neck || o.measurement_notes);

    if (orderWithMeasurements) {
      setBust(String(orderWithMeasurements.bust || ''));
      setWaist(String(orderWithMeasurements.waist || ''));
      setShoulder(String(orderWithMeasurements.shoulder || ''));
      setArmhole(String(orderWithMeasurements.armhole || ''));
      setSleeveLength(String(orderWithMeasurements.sleeve_length || ''));
      setFrontNeck(String(orderWithMeasurements.front_neck || ''));
      setBackNeck(String(orderWithMeasurements.back_neck || ''));
      
      try {
        if (orderWithMeasurements.measurement_notes) {
          const adv = JSON.parse(orderWithMeasurements.measurement_notes);
          setLength(String(adv.length || ''));
          setUnderbust(String(adv.underbust || ''));
          setHip(String(adv.hip || ''));
          setPantLength(String(adv.pant_length || ''));
          setMeasurementNotes(String(adv.notes || ''));
        }
      } catch (e) {
        setMeasurementNotes(String(orderWithMeasurements.measurement_notes || ''));
      }
      
      Alert.alert("Customer Found!", "Previous measurements have been loaded.");
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', price: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: string, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      if (manipResult.base64) {
        setDesignPhotos(prev => [...prev, manipResult.base64 as string]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setDesignPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.description.trim() !== '');
    if (!customerName || !phone || validItems.length === 0) {
      Alert.alert("Missing Fields", "Please provide Customer Name, Phone, and at least one Order Item.");
      return;
    }

    const advance = Number(advancePayment || 0);
    if (advance > computedTotal) {
      Alert.alert("Invalid Payment", "Advance payment cannot be greater than the Total Bill.");
      return;
    }

    setLoading(true);
    try {
      let finalCustomerId = selectedCustomerId;

      // 1. Create Customer if new
      if (!finalCustomerId) {
        const custRes = await createCustomer({ name: customerName, phone, address });
        if (custRes.status === 'success') {
          finalCustomerId = custRes.customer_id;
          dispatch(addCustomerLocal({ customer_id: finalCustomerId, name: customerName, phone, address, created_at: new Date().toISOString() }));
        } else {
          throw new Error("Failed to create customer");
        }
      }

      // 2. Create Order
      // FIX: The GAS backend double-counts advance payments if we send it in the initial payload. 
      // So we send 0 for total_paid initially, and trigger a separate payment event below!
      const advancedMeasurements = { length, underbust, hip, pant_length: pantLength, notes: measurementNotes };

      const orderPayload = {
        customer_id: finalCustomerId,
        order_type: JSON.stringify(validItems),
        delivery_date: deliveryDate,
        total_amount: computedTotal.toString(),
        total_paid: "0", 
        status: 'Working',
        bust, waist, shoulder, armhole, sleeve_length: sleeveLength, front_neck: frontNeck, back_neck: backNeck,
        measurement_notes: JSON.stringify(advancedMeasurements)
      };

      const orderRes = await createOrder(orderPayload);
      if (orderRes.status !== 'success') throw new Error("Failed to create order");
      
      const orderId = orderRes.order_id;
      
      // Add order to Redux with the ACTUAL correct local balance and paid amount
      dispatch(addOrderLocal({ 
        order_id: orderId, 
        ...orderPayload, 
        total_paid: advancePayment || "0",
        balance: computedTotal - advance
      }));

      // 2.5 Log the Advance Payment to GAS explicitly to avoid backend double-counting
      if (advance > 0) {
        await addPayment({
          order_id: orderId,
          customer_id: finalCustomerId,
          amount: advance.toString(),
          payment_mode: 'Cash',
          notes: 'Initial Advance'
        });
      }

      // 3. Upload Photos
      for (let i = 0; i < designPhotos.length; i++) {
        await uploadPhoto(designPhotos[i], `Design_${i+1}.jpg`, orderId);
      }

      Alert.alert("Success", "Order created successfully!");
      router.replace('/(drawer)/dashboard');

    } catch (error: any) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* CUSTOMER SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        
        {!selectedCustomerId && (
          <View style={{ zIndex: 10 }}>
            <TextInput style={styles.input} placeholder="Search existing customer (Name or Phone)..." value={searchQuery} onChangeText={setSearchQuery} />
            {filteredCustomers.length > 0 && (
              <View style={styles.autocompleteBox}>
                {filteredCustomers.slice(0,3).map((c: any) => (
                  <TouchableOpacity key={c.customer_id} style={styles.autoItem} onPress={() => handleSelectCustomer(c)}>
                    <Text style={{ fontWeight: 'bold' }}>{c.name}</Text>
                    <Text style={{ color: '#666' }}>{c.phone}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <TextInput style={styles.input} placeholder="Customer Name *" value={customerName} onChangeText={(t) => { setCustomerName(t); setSelectedCustomerId(null); }} />
        <TextInput style={styles.input} placeholder="Phone Number *" keyboardType="phone-pad" value={phone} onChangeText={(t) => { setPhone(t); setSelectedCustomerId(null); }} />
        <TextInput style={styles.input} placeholder="Address (Optional)" value={address} onChangeText={setAddress} />
      </View>

      {/* BILLING ITEMS SECTION */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Order Items</Text>
          <TouchableOpacity onPress={handleAddItem} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="add-circle" size={20} color="#4A3B32" />
            <Text style={{ color: '#4A3B32', fontWeight: 'bold', marginLeft: 4 }}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 2, marginRight: 10 }}>
              <TextInput style={styles.input} placeholder={`Item ${index + 1} (e.g. Saree Fall)`} value={item.description} onChangeText={(t) => updateItem(item.id, 'description', t)} />
            </View>
            <View style={{ flex: 1, marginRight: 10 }}>
              <TextInput style={styles.input} placeholder="Price ₹" keyboardType="numeric" value={item.price} onChangeText={(t) => updateItem(item.id, 'price', t)} />
            </View>
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={{ padding: 10, justifyContent: 'center' }}>
              <MaterialIcons name="remove-circle" size={24} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity 
          style={[styles.input, { justifyContent: 'center' }]} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: deliveryDate ? '#333' : '#999', fontSize: 16 }}>
            {deliveryDate || "Target Delivery Date *"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dateObject}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}
      </View>

      {/* MEASUREMENTS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Master Measurements</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Length" value={length} onChangeText={setLength} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Shoulder" value={shoulder} onChangeText={setShoulder} keyboardType="numeric" />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Bust" value={bust} onChangeText={setBust} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Underbust" value={underbust} onChangeText={setUnderbust} keyboardType="numeric" />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Waist" value={waist} onChangeText={setWaist} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Hip" value={hip} onChangeText={setHip} keyboardType="numeric" />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Armhole" value={armhole} onChangeText={setArmhole} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Sleeve Len" value={sleeveLength} onChangeText={setSleeveLength} keyboardType="numeric" />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Pant Len" value={pantLength} onChangeText={setPantLength} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Front Neck" value={frontNeck} onChangeText={setFrontNeck} keyboardType="numeric" />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Back Neck" value={backNeck} onChangeText={setBackNeck} keyboardType="numeric" />
          <View style={styles.halfInput} />
        </View>
        <TextInput 
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
          placeholder="Measurement Notes / Description (e.g. keep tight, high neck)" 
          value={measurementNotes} 
          onChangeText={setMeasurementNotes} 
          multiline 
        />
      </View>

      {/* PHOTOS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {designPhotos.map((photo, index) => (
            <View key={index} style={styles.photoThumbnail}>
              <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.photoImage} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                <MaterialIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addPhotoBox} onPress={pickImage}>
            <MaterialIcons name="add-a-photo" size={24} color="#6B5B52" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* PAYMENT SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.totalBox}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Total Bill:</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4A3B32' }}>₹{computedTotal}</Text>
        </View>
        <TextInput style={styles.input} placeholder="Advance Paid (₹)" keyboardType="numeric" value={advancePayment} onChangeText={setAdvancePayment} />
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ marginHorizontal: 20, marginTop: 10 }}>
        <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
          style={{ padding: 18, borderRadius: 8, alignItems: 'center' }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>CREATE ORDER</Text>}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E6E2DD' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A3B32', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#E6E2DD', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15, backgroundColor: '#FAF9F6' },
  halfInput: { flex: 1, marginHorizontal: 5 },
  row: { flexDirection: 'row', marginHorizontal: -5 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  autocompleteBox: { position: 'absolute', top: 55, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, zIndex: 100, elevation: 5 },
  autoItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  photoScroll: { flexDirection: 'row' },
  addPhotoBox: { width: 100, height: 100, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#4A3B32', backgroundColor: '#F2EBE5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  photoThumbnail: { width: 100, height: 100, borderRadius: 8, marginRight: 10, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  removePhotoBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F2EBE5', padding: 15, borderRadius: 8, marginBottom: 15 },
  submitButton: { backgroundColor: '#4A3B32', marginHorizontal: 20, padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});
