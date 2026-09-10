import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Bill, fetchProductsFromGoogleSheets, Product, fetchCustomersFromGoogleSheets, Customer, saveBillToGoogleSheets, saveStockEntryToGoogleSheets } from "../../../redux/billSlice"; // UPDATED IMPORT
import { AppDispatch, RootState } from '../../../redux/store'; // Added AppDispatch for async thunks
import { printBill } from '../../../utils/printBill';



export default function BillingScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  // Typed dispatch is recommended for AsyncThunks
  const dispatch = useDispatch<AppDispatch>();

  const availableProducts = useSelector((state: RootState) => state.billing.products);
  const customers = useSelector((state: RootState) => state.billing.customers);
  const stockLedger = useSelector((state: RootState) => state.billing.stockLedger);

  const handleSearchCustomer = (text: string) => {
    setCustomerName(text);
    if (text.length > 0) {
      const filtered = (customers || []).filter(c => c.name.toLowerCase().includes(text.toLowerCase()));
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(true);
    } else {
      setShowCustomerDropdown(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    if (customer.phone) setPhone(customer.phone);
    setShowCustomerDropdown(false);
    Keyboard.dismiss();
  };


  useEffect(() => {
    // Only fetch if we don't have products yet (optimization)
    if (availableProducts.length === 0) {
      dispatch(fetchProductsFromGoogleSheets());
    dispatch(fetchCustomersFromGoogleSheets());
    }
  }, [dispatch]);

  const [billDate, setBillDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('');

  const [labourName, setLabourName] = useState('');
  const [labourCost, setLabourCost] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [vehicleName, setVehicleName] = useState('');


  const [remarks, setRemarks] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [nextServiceKm, setNextServiceKm] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [pendingAmount, setPendingAmount] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState<Date | null>(null);
  const [showServiceDatePicker, setShowServiceDatePicker] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // New Loading State
  const [isSaving, setIsSaving] = useState(false);

  const [cartItems, setCartItems] = useState<{
    id: string;
    name: string;
    qty: number;
    rate: number;
    amount: number;
    type: 'product' | 'labour'
  }[]>([]);

  // --- CALCULATIONS ---
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.amount, 0), [cartItems]);
  const tax = subtotal * 0; // 0% Tax
  const grandTotal = subtotal + tax;

  useEffect(() => {
    const advance = parseFloat(advancePayment) || 0;
    const pending = Math.max(0, grandTotal - advance);
    setPendingAmount(pending > 0 ? String(pending) : '0');
  }, [grandTotal, advancePayment]);

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
    setRate(String(product.price));
    setShowDropdown(false);
    Keyboard.dismiss();
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

    const n = productName.trim().toLowerCase();
    const isBox = n.includes('rex prime') || n.includes('rex 90') || n.includes('sun 90');

    const newItem = {
      id: Date.now().toString(),
      name: productName,
      qty: quantity,
      rate: unitPrice,
      amount: quantity * unitPrice,
      type: 'product' as const,
      unit: isBox ? 'Box' : 'Nos'
    };

    setCartItems([...cartItems, newItem]);

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

  // --- UPDATED SAVE FUNCTION ---
  const handlePrintBill = async () => {

    if (cartItems.length === 0) {
      Alert.alert('Empty Bill', 'Please add items before printing.');
      return;
    }

    if (!customerName) {
      Alert.alert('Missing Info', 'Please enter customer name.');
      return;
    }

    // --- STOCK VALIDATION PER PRODUCT ---
    const productItems = cartItems.filter(item => item.type === "product");
    for (const item of productItems) {
      // Find the product in the catalog
      const product = availableProducts.find(p => p.name === item.name);
      if (product) {
        // Calculate available stock for this specific product
        const availableStock = (stockLedger || [])
          .filter(s => s.productId === product.id)
          .reduce((acc, curr) => curr.type === "IN" ? acc + curr.qty : acc - curr.qty, 0);
        
        const requiredQty = Number(item.qty);
        if (requiredQty > availableStock) {
          Alert.alert("Insufficient Stock", `You are billing ${requiredQty} of ${product.name} but only ${availableStock} available.`);
          return;
        }
      }
    }

    // Start Loading
    setIsSaving(true);

    const newBill: Bill = {
      id: `#INV-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName,
      vehicleNumber: vehicle || 'N/A',
      vehicleName: vehicleName || '',
      customerPhone: phone,
      date: billDate,
      status: (pendingAmount && parseFloat(pendingAmount) > 0) ? 'Pending' : 'Paid',
      amount: grandTotal,
      subtotal,
      tax,
      discount: 0,
      grandTotal,
      items: cartItems,
      remarks: remarks,
      currentKm: currentKm ? parseFloat(currentKm) : 0,
      nextServiceKm: nextServiceKm ? parseFloat(nextServiceKm) : 0,
      advancePayment: advancePayment ? parseFloat(advancePayment) : 0,
      pendingAmount: pendingAmount ? parseFloat(pendingAmount) : 0,
      nextServiceDate: nextServiceDate
        ? `${nextServiceDate.getFullYear()}-${String(nextServiceDate.getMonth() + 1).padStart(2, '0')}-${String(nextServiceDate.getDate()).padStart(2, '0')}`
        : '',
      paymentHistory: (() => {
        const adv = advancePayment ? parseFloat(advancePayment) : 0;
        const pen = pendingAmount ? parseFloat(pendingAmount) : 0;
        const initialPayment = adv > 0 ? adv : (pen === 0 ? grandTotal : 0);
        return initialPayment > 0 ? [{ date: new Date().toISOString(), amount: initialPayment, method: paymentMethod }] : [];
      })()
    };

    try {
      // 1. Save to Google Sheets
      await dispatch(saveBillToGoogleSheets(newBill)).unwrap();

      // 2. Deduct stock per product
      productItems.forEach((item, index) => {
        const product = availableProducts.find(p => p.name === item.name);
        if (product) {
          // Stagger dispatches slightly to avoid rate limits
          setTimeout(() => {
            dispatch(saveStockEntryToGoogleSheets({
              id: Date.now().toString() + "_" + index,
              date: new Date().toISOString(),
              type: "OUT",
              qty: Number(item.qty),
              remarks: `Billed to ${newBill.customerName}`,
              referenceId: newBill.id,
              unit: product.unit || "Box",
              productId: product.id,
              productName: product.name
            })).unwrap().catch(e => console.warn("Stock deduct failed:", e));
          }, index * 60);
        }
      });
      
      // STOP LOADING IMMEDIATELY! (Fixes the print dialog freeze)
      setIsSaving(false);
      
      // 2. Generate PDF in the background (Remove 'await')
      printBill(newBill).catch(console.error);

      // 3. Reset Form IMMEDIATELY
      setCartItems([]);
      setCustomerName('');
      setPhone('');
      setVehicle('');
      setRemarks('');
      setCurrentKm('');
      setNextServiceKm('');
      setVehicleName('');
      setAdvancePayment('');
      setPaymentMethod('Cash');
      setPendingAmount('');
      setNextServiceDate(null);
      setProductName("");
      setQty('1');
      setRate('');
      setLabourName('');
      setLabourCost('');

      // 4. Show Success Alert last
      Alert.alert('Success', 'Bill saved to Google Sheets and PDF generated!');
    } catch (error: any) {
      setIsSaving(false); // Ensure loading stops on error
      Alert.alert("Failed to Save", "Check your Internet Connection");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
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
            <TouchableOpacity
              onPress={() => router.push('/(drawer)/dashboard')}
            >
              <Ionicons name="speedometer-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Add Products */}
          <View style={[styles.card, { zIndex: 10 }]}>


            <Text style={styles.sectionTitle}>Add Products</Text>
            <Text style={styles.label}>Product Name</Text>

            <View style={styles.autocompleteContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type product name..."
                placeholderTextColor="#999"
                value={productName}
                onChangeText={handleSearchProduct}
                onFocus={() => {
                  if (productName) setShowDropdown(true);
                }}
                onSubmitEditing={() => setShowDropdown(false)}
              />

              {showDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true} // Important for Android
                    style={{ maxHeight: 200 }} // Ensure ScrollView respects the height
                  >

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

                  </ScrollView>
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
                  editable={true}
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












          {/* Bill Items */}
          <View style={styles.card}>
            <View style={styles.billHeaderRow}>
              <Text style={styles.billSectionTitle}>Bill Items ({cartItems.length})</Text>
              <Text style={styles.totalText}>Total: <Text style={styles.totalAmount}>₹{grandTotal.toFixed(2)}</Text></Text>
            </View>

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
              <Text style={styles.label}>Bill Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F3F4F6', color: '#6B7280' }]}
                value={billDate}
                editable={false}
                placeholder="e.g., 4 Sep 2026"
              />
            </View>

            
            <View style={styles.autocompleteContainer}>
              <Text style={styles.label}>Customer / Party Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Type customer name..."
                placeholderTextColor="#999"
                value={customerName}
                onChangeText={handleSearchCustomer}
                onFocus={() => {
                  if (customerName) setShowCustomerDropdown(true);
                }}
                onSubmitEditing={() => setShowCustomerDropdown(false)}
              />

              {showCustomerDropdown && (
                <View style={[styles.dropdownList, { maxHeight: 150 }]}>
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                    {filteredCustomers.length === 0 ? (
                      <View style={styles.noResult}>
                        <Text style={{ color: '#999' }}>New party. Will be added automatically or just billed.</Text>
                      </View>
                    ) : (
                      filteredCustomers.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectCustomer(item)}
                        >
                          <Text style={styles.dropdownItemName}>{item.name}</Text>
                          <Text style={styles.dropdownItemPrice}>{item.phone || 'No phone'}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
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
          </View>

          {/* Remarks */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Remarks</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder='Add any additional notes here...'
                placeholderTextColor='#999'
                multiline
                numberOfLines={3}
                textAlignVertical='top'
                value={remarks}
                onChangeText={setRemarks}
              />
            </View>
          </View>
          
          {/* Advance Payment */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.methodBtn, paymentMethod === 'Cash' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('Cash')}
                >
                  <Ionicons name="cash-outline" size={18} color={paymentMethod === 'Cash' ? '#FFF' : '#6B7280'} />
                  <Text style={[styles.methodBtnText, paymentMethod === 'Cash' && styles.methodBtnTextActive]}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodBtn, paymentMethod === 'Online' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('Online')}
                >
                  <Ionicons name="card-outline" size={18} color={paymentMethod === 'Online' ? '#FFF' : '#6B7280'} />
                  <Text style={[styles.methodBtnText, paymentMethod === 'Online' && styles.methodBtnTextActive]}>Online</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Advance Payment (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={advancePayment}
                onChangeText={setAdvancePayment}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pending Amount (₹) <Text style={styles.optionalLabel}>(Auto-calculated)</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#E5E7EB', color: '#6B7280' }]}
                value={pendingAmount}
                editable={false}
              />
            </View>
          </View>

          {/* Footer Button - Updated with Loading State */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[styles.printButton, isSaving && { opacity: 0.7 }]}
              onPress={handlePrintBill}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="print" size={20} color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.printButtonText}>
                {isSaving ? "Saving Bill..." : "Save & Print Bill"}
              </Text>
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
    backgroundColor: "#fff",

  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  methodBtnActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  methodBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodBtnTextActive: {
    color: '#FFF',
  },
  optionalLabel: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  autocompleteContainer: {
    marginBottom: 12,
    zIndex: 100,
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
    //maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
    overflow: "hidden"
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
    backgroundColor: '#1F2937',
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
  printButton: { backgroundColor: '#1F2937',
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
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
});