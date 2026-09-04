import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ToastAndroid, FlatList, RefreshControl, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import { Customer, fetchCustomersFromGoogleSheets, saveCustomerToGoogleSheets, deleteCustomerFromGoogleSheets } from '../../../redux/billSlice';

export default function AddCustomerScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { customers, status } = useSelector((state: RootState) => state.billing);
  const isLoadingList = status === "loading";

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(fetchCustomersFromGoogleSheets());
  }, [dispatch]);

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    
    if (phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsSaving(true);

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone
    };

    try {
      await dispatch(saveCustomerToGoogleSheets(newCustomer)).unwrap();
      ToastAndroid.show('Customer added', ToastAndroid.SHORT);
      setName('');
      setPhone('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save customer: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteCustomerFromGoogleSheets(id)).unwrap();
              ToastAndroid.show('Customer deleted', ToastAndroid.SHORT);
            } catch (error: any) {
              Alert.alert("Delete Failed", error.message);
            }
          }
        }
      ]
    );
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <View style={styles.listItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-outline" size={20} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.phone ? <Text style={styles.itemPhone}>{item.phone}</Text> : null}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item.id, item.name)}
        style={{ padding: 8, marginLeft: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Party</Text>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')}>
          <Ionicons name="speedometer-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...(customers || [])].reverse()} 
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingList}
            onRefresh={() => dispatch(fetchCustomersFromGoogleSheets())}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Add New Party</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Party Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  editable={!isSaving}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="person-add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save Party"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.listLabel}>Saved Parties</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No parties found. Add one above!</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#FFF', margin: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16, },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827', },
  saveButton: { backgroundColor: '#1F2937', borderRadius: 8, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  listLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 16, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12, },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937', },
  itemPhone: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 30, fontSize: 14, }
});
