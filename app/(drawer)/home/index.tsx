import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Modal,
  FlatList,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, } from '../../../redux/store';
import { addBill, Product } from "../../../redux/billSlice";
import { SafeAreaView } from 'react-native-safe-area-context';


export default function BillingScreen() {


  const navigation = useNavigation();
  const dispatch = useDispatch();


  const availableProducts = useSelector((state: RootState) => state.billing.products);


  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('');

  const [labourName, setLabourName] = useState('');
  const [labourCost, setLabourCost] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');

  const [remarks, setRemarks] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [nextServiceKm, setNextServiceKm] = useState("");


  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);





  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    name: string;
    qty: number;
    rate: number;
    amount: number;
    type: 'product' | 'labour'
  }>>([]);




  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.amount, 0), [cartItems]);
  const tax = subtotal * 0; // 0% Tax
  const grandTotal = subtotal + tax;











  const handleSearchProduct = (text: string) => {

    setProductName(text);
    if (text.length > 0) {
      const filtered = availableProducts.filter(p =>
        p.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  


  const handleSelectProduct = (product: Product) => {
    setProductName(product.name);
    setRate(product.price);
    setShowDropdown(false);
    Keyboard.dismiss(); // Hide keyboard
  };



  const handleAddItem = () => {

    if (!productName) {
      Alert.alert('Missing Info', 'Please select a product');
      return;
    }
    const quantity = parseFloat(qty) || 0;
    const unitPrice = parseFloat(rate) || 0;

    if (quantity <= 0 || unitPrice <= 0) {
      Alert.alert('Invalid Input', 'Quantity and Amount must be greater than 0');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: productName,
      qty: quantity,
      rate: unitPrice,
      amount: quantity * unitPrice,
      type: 'product' as const
    };

    setCartItems([...cartItems, newItem]);

    // Reset fields
    setProductName("");
    setQty('1');
    setRate('');
  };

  const handleAddLabour = () => {

    if (!labourName || !labourCost) return;

    const cost = parseFloat(labourCost) || 0;
    const newItem = {
      id: Date.now().toString(),
      name: labourName,
      qty: 1,
      rate: cost,
      amount: cost,
      type: 'labour' as const
    };

    setCartItems([...cartItems, newItem]);
    setLabourName('');
    setLabourCost('');
  };




  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };





  const handlePrintBill = () => {


    if (cartItems.length === 0) {
      Alert.alert('Empty Bill', 'Please add items before printing.');
      return;
    }

    if (!customerName) {
      Alert.alert('Missing Info', 'Please enter customer name.');
      return;
    }

    const newBill = {

      id: `#INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      vehicleNumber: vehicle || 'N/A',
      customerPhone: phone,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Paid' as const, // Defaulting to Paid for now
      amount: grandTotal,
      subtotal,
      tax,
      discount: 0,
      grandTotal,
      items: cartItems,
      remarks: remarks,
      currentKm: currentKm ? parseFloat(currentKm) : 0, 
      nextServiceKm: nextServiceKm ? parseFloat(nextServiceKm) : 0,

    };

    dispatch(addBill(newBill));

    Alert.alert('Success', 'Bill generated and saved to history!', [
      {
        text: 'OK', onPress: () => {
          // Reset Form
          setCartItems([]);
          setCustomerName('');
          setPhone('');
          setVehicle('');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >

        <View style={styles.cardMenu}>

          <View style={styles.headerRow}>

            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Ionicons name="menu" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.cardTitle}>Billing Home</Text>

            <TouchableOpacity>
              <Ionicons name="time-outline" size={24} color="#333" />
            </TouchableOpacity>

          </View>

        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >





          <View style={[styles.card, { zIndex: 10 }]}>

            <Text style={styles.sectionTitle}>Add Products</Text>

            <Text style={styles.label}>Product Name</Text>

            
            <View style={styles.autocompleteContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type product name..."
                placeholderTextColor="#999"
                value={productName}
                onChangeText={handleSearchProduct} // Call search logic
                onFocus={() => {
                  if (productName) setShowDropdown(true);
                }}
              />

              
              {showDropdown && (
                <View style={styles.dropdownList}>
                  {filteredProducts.length === 0 ? (
                    <View style={styles.noResult}>
                      <Text style={{ color: '#999' }}>No matches. Use as custom item.</Text>
                    </View>
                  ) : (
                    filteredProducts.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectProduct(item)}
                      >
                        <Text style={styles.dropdownItemName}>{item.name}</Text>
                        <Text style={styles.dropdownItemPrice}>₹{item.price}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
            




            <View style={styles.row}>

              <View style={[styles.column, { marginRight: 10 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                />
              </View>


              <View style={styles.column}>
                <Text style={styles.label}>Rate (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.addButtonPrimary} onPress={handleAddItem}>
              <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 5 }} />
              <Text style={styles.addButtonTextPrimary}>Add Item</Text>
            </TouchableOpacity>
          </View>









          {/*  Labour Charges */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Labour Charges</Text>

            <View style={styles.row}>
              <View style={[styles.column, { marginRight: 10 }]}>
                <Text style={styles.label}>Labour/Service Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Oil Change"
                  placeholderTextColor="#999"
                  value={labourName}
                  onChangeText={setLabourName}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Cost (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={labourCost}
                  onChangeText={setLabourCost}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.addButtonSecondary} onPress={handleAddLabour}>
              <Ionicons name="add" size={20} color="#3B82F6" style={{ marginRight: 5 }} />
              <Text style={styles.addButtonTextSecondary}>Add Labour</Text>
            </TouchableOpacity>
          </View>











          {/*  Bill Items */}
          <View style={styles.card}>

            <View style={styles.billHeaderRow}>
              <Text style={styles.billSectionTitle}>Bill Items ({cartItems.length})</Text>
              <Text style={styles.totalText}>Total: <Text style={styles.totalAmount}>₹{grandTotal.toFixed(2)}</Text></Text>
            </View>

            {/* Dynamic List */}
            {cartItems.length === 0 ? (
              <Text style={{ color: '#999', textAlign: 'center', padding: 10 }}>No items added yet</Text>
            ) : (
              cartItems.map((item, index) => (

                <View key={item.id} style={[styles.billItem, index === cartItems.length - 1 && { borderBottomWidth: 0 }]}>

                  <View style={styles.billItemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.type === 'product' ? (
                      <Text style={styles.itemMeta}>Qty: {item.qty} x ₹{item.rate.toFixed(2)}</Text>
                    ) : (
                      <Text style={styles.itemMeta}>Service Charge</Text>
                    )}
                  </View>

                  <View style={styles.billItemRight}>
                    <Text style={styles.itemPrice}>₹{item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                </View>


              ))
            )}
          </View>



          {/* Customer Information */}
          <View style={styles.card}>

            <Text style={styles.sectionTitle}>Customer Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                placeholderTextColor="#999"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number <Text style={styles.optionalLabel}>(Optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Number <Text style={styles.optionalLabel}>(Optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter vehicle number"
                placeholderTextColor="#999"
                value={vehicle}
                onChangeText={setVehicle}
              />
            </View>

          </View>

          {/* Service Details & Remarks */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Details</Text>

            <View style={styles.row}>
              <View style={[styles.column, { marginRight: 10 }]}>
                <Text style={styles.label}>Current KM</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12500"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={currentKm}
                  onChangeText={setCurrentKm}
                />
              </View>

              <View style={styles.column}>
                <Text style={styles.label}>Next Service KM</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={nextServiceKm}
                  onChangeText={setNextServiceKm}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Remarks / Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific notes for this bill..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={remarks}
                onChangeText={setRemarks}
              />
            </View>
          </View>



          {/* Footer Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.printButton} onPress={handlePrintBill}>
              <Ionicons name="print" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.printButtonText}>Print Bill</Text>
            </TouchableOpacity>
          </View>


          

          <View style={{ height: 40 }} />


        </ScrollView>








      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  headerTitleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
  },
  screenHeaderLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  cardMenu: {
    backgroundColor: "#fff",
    height: 50,
    marginBottom: 30,
    justifyContent: "center",
    paddingHorizontal: 16,

  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Specific internal styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  optionalLabel: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  // --- NEW STYLES FOR AUTOCOMPLETE ---
  autocompleteContainer: {
    marginBottom: 12,
    zIndex: 100, // Important for stacking on Android
    position: 'relative'
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemName: {
    fontSize: 14,
    color: '#333'
  },
  dropdownItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6'
  },
  noResult: {
    padding: 12,
    alignItems: 'center'
  },
  // -----------------------------------
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  placeholderText: {
    color: '#4B5563',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  column: {
    flex: 1,
  },
  addButtonPrimary: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonTextPrimary: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  addButtonSecondary: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonTextSecondary: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  billHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  totalAmount: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  billItemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  billItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  footerContainer: {
    marginTop: 4,
  },
  printButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemName: {
    fontSize: 16,
    color: '#333',
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    paddingTop: 10, 
  },
});