import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ToastAndroid, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import { StockLedger, fetchStockLedgerFromGoogleSheets, saveStockEntryToGoogleSheets } from '../../../redux/billSlice';

export default function AddStockScreen() {
  const [qty, setQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { stockLedger, status } = useSelector((state: RootState) => state.billing);
  const isLoadingList = status === "loading";

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(fetchStockLedgerFromGoogleSheets());
  }, [dispatch]);

  const handleSave = async () => {
    const numQty = parseInt(qty);
    if (!qty || isNaN(numQty) || numQty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setIsSaving(true);

    const newEntry: StockLedger = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'IN',
      qty: numQty,
      remarks: remarks || 'Manual Stock Addition',
    };

    try {
      await dispatch(saveStockEntryToGoogleSheets(newEntry)).unwrap();
      ToastAndroid.show('Stock Added', ToastAndroid.SHORT);
      setQty('');
      setRemarks('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add stock: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const currentStock = (stockLedger || []).reduce((acc, curr) => {
    return curr.type === 'IN' ? acc + curr.qty : acc - curr.qty;
  }, 0);

  const renderItem = ({ item }: { item: StockLedger }) => (
    <View style={styles.listItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.iconContainer, { backgroundColor: item.type === 'IN' ? '#DCFCE7' : '#FEE2E2' }]}>
          <Ionicons name={item.type === 'IN' ? "arrow-down" : "arrow-up"} size={20} color={item.type === 'IN' ? "#16A34A" : "#DC2626"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>
            {item.remarks 
              ? item.remarks.replace(/\s*\(Inv:\s*[^)]+\)/g, '') 
              : (item.type === 'IN' ? 'Stock Added' : 'Stock Removed')}
          </Text>
          <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.itemQty, { color: item.type === 'IN' ? "#16A34A" : "#DC2626" }]}>
          {item.type === 'IN' ? '+' : '-'}{item.qty}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Stock</Text>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')}>
          <Ionicons name="speedometer-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...(stockLedger || [])].reverse()} 
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingList}
            onRefresh={() => dispatch(fetchStockLedgerFromGoogleSheets())}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.stockOverviewCard}>
               <Text style={styles.overviewLabel}>Total Boxes in Stock</Text>
               <Text style={styles.overviewValue}>{currentStock}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Add New Stock (Boxes)</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity Received</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={qty}
                  onChangeText={setQty}
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Remarks (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={remarks}
                  onChangeText={setRemarks}
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
                  <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Add to Stock"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.listLabel}>Stock History Ledger</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No stock history found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  stockOverviewCard: { backgroundColor: '#1F2937', margin: 16, marginBottom: 0, borderRadius: 12, padding: 24, alignItems: 'center' },
  overviewLabel: { color: '#E0E7FF', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  overviewValue: { color: '#FFF', fontSize: 40, fontWeight: '800' },
  card: { backgroundColor: '#FFF', margin: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16, },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827', },
  saveButton: { backgroundColor: '#1F2937', borderRadius: 8, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  listLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 16, marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937', },
  itemDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  itemQty: { fontSize: 18, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 30, fontSize: 14, }
});
