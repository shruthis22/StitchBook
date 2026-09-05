import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProductFromGoogleSheets, fetchProductsFromGoogleSheets, Product, saveProductToGoogleSheets } from '../../../redux/billSlice';
import { AppDispatch, RootState } from '../../../redux/store';

export default function AddProductScreen() {

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<'Box' | 'Nos'>('Box');
  const [isSaving, setIsSaving] = useState(false); // Loading state

  const { products, status } = useSelector((state: RootState) => state.billing)
  const isLoadingList = status === "loading";

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSaving(true);

    const newProduct = {
      id: Date.now().toString(),
      name,
      price,
      unit
    };

    try {
      // Dispatch async action to save to Google Sheets
      await dispatch(saveProductToGoogleSheets(newProduct)).unwrap();

      ToastAndroid.show('Product added', ToastAndroid.SHORT);
      setName('');
      setPrice('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save product: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProductsFromGoogleSheets());
  }, [dispatch]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProductFromGoogleSheets(id)).unwrap();
              ToastAndroid.show('Product deleted', ToastAndroid.SHORT);
            } catch (error: any) {
              Alert.alert("Delete Failed", error.message);
            }
          }
        }
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.listItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={20} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name} <Text style={{fontSize:12, color:'#9CA3AF', fontWeight:'500'}}>({item.unit === 'Nos' ? 'Nos' : 'Box'})</Text></Text>
        </View>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
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
        <Text style={styles.headerTitle}>Add New Product</Text>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')}>
          <Ionicons name="speedometer-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...products].reverse()} // Show newest first
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingList}
            onRefresh={() => dispatch(fetchProductsFromGoogleSheets())}
          />
        }
        // This component contains the Form (Header of the list)
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Add New Product</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Default Price (INR)</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    editable={!isSaving}
                    />
                  </View>
                </View>
  
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Selling Unit</Text>
                  
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.methodBtn, unit === 'Box' && styles.methodBtnActive]}
                    onPress={() => setUnit('Box')}
                  >
                    <Ionicons name="cube-outline" size={18} color={unit === 'Box' ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.methodBtnText, unit === 'Box' && styles.methodBtnTextActive]}>Box</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodBtn, unit === 'Nos' && styles.methodBtnActive]}
                    onPress={() => setUnit('Nos')}
                  >
                    <Ionicons name="apps-outline" size={18} color={unit === 'Nos' ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.methodBtnText, unit === 'Nos' && styles.methodBtnTextActive]}>Nos</Text>
                  </TouchableOpacity>
                </View>
              </View>

                {/* Save Button inside the card for better flow */}
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
                  {isSaving ? "Saving..." : "Add Product"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* List Label */}
            <Text style={styles.listLabel}>Recently Added Products</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products found. Add one above!</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  priceContainer: {
    position: 'relative',
    justifyContent: 'center'
  },
  currencySymbol: {
    position: 'absolute',
    left: 12, zIndex: 1,
    color: '#6B7280',
    fontSize: 16
  },
  priceInput: {
    paddingLeft: 30
  },
  saveButton: { backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  listLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 30,
    fontSize: 14,
  },

  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB',
  },
  methodBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  methodBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  methodBtnTextActive: { color: '#FFF' },
});