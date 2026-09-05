const fs = require("fs");
const content = `import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ToastAndroid, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import { StockLedger, fetchStockLedgerFromGoogleSheets, saveStockEntryToGoogleSheets, fetchProductsFromGoogleSheets, Product } from "../../../redux/billSlice";

export default function AddStockScreen() {
  const [qty, setQty] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { stockLedger, products, status } = useSelector((state: RootState) => state.billing);
  const isLoadingList = status === "loading";

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  useEffect(() => {
    dispatch(fetchStockLedgerFromGoogleSheets());
    if (products.length === 0) dispatch(fetchProductsFromGoogleSheets());
  }, [dispatch]);

  const handleSave = async () => {
    const numQty = parseInt(qty);
    if (!qty || isNaN(numQty) || numQty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }
    
    if (!selectedProductId) {
      Alert.alert("Error", "Please select a product");
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    setIsSaving(true);

    const newEntry: StockLedger = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: "IN",
      qty: numQty,
      remarks: remarks || "Manual Stock Addition",
      unit: selectedProduct.unit || "Box",
      productId: selectedProduct.id,
      productName: selectedProduct.name
    };

    try {
      await dispatch(saveStockEntryToGoogleSheets(newEntry)).unwrap();
      ToastAndroid.show("Stock Added", ToastAndroid.SHORT);
      setQty("");
      setRemarks("");
      setSelectedProductId(null);
    } catch (error: any) {
      Alert.alert("Error", "Failed to add stock: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Compute stock per product
  const getProductStock = (productId: string) => {
    return (stockLedger || [])
      .filter(s => s.productId === productId)
      .reduce((acc, curr) => curr.type === "IN" ? acc + curr.qty : acc - curr.qty, 0);
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const currentStock = getProductStock(item.id);
    const isSelected = selectedProductId === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, isSelected && styles.productCardSelected]}
        onPress={() => setSelectedProductId(item.id)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.productName, isSelected && styles.productNameSelected]}>{item.name}</Text>
          <Text style={styles.productUnit}>Unit: {item.unit || "Box"}</Text>
        </View>
        <View style={styles.stockBadge}>
          <Text style={styles.stockBadgeText}>{currentStock} {item.unit || "Box"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Stocks</Text>
        <TouchableOpacity onPress={() => navigation.navigate("dashboard")}>
          <Ionicons name="speedometer-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products || []}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingList}
            onRefresh={() => {
              dispatch(fetchStockLedgerFromGoogleSheets());
              dispatch(fetchProductsFromGoogleSheets());
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Add Stock</Text>
              
              {!selectedProductId ? (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                  <Text style={styles.infoText}>Select a product from the list below to add stock.</Text>
                </View>
              ) : (
                <View style={styles.selectedProductBox}>
                  <Text style={styles.selectedProductLabel}>Selected Product:</Text>
                  <Text style={styles.selectedProductValue}>{products.find(p => p.id === selectedProductId)?.name}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={qty}
                  onChangeText={setQty}
                  editable={!isSaving}
                  placeholder="e.g. 50"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Remarks (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={remarks}
                  onChangeText={setRemarks}
                  editable={!isSaving}
                  placeholder="e.g. Supplier delivery"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, (isSaving || !selectedProductId) && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSaving || !selectedProductId}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Add Stock"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionHeader, { marginLeft: 16, marginTop: 10, marginBottom: 10 }]}>Current Stock Levels</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB"
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    marginHorizontal: 16, marginTop: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  sectionHeader: { fontSize: 16, fontWeight: "700", color: "#1F2937", marginBottom: 16 },
  infoBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 12, borderRadius: 8, marginBottom: 16 },
  infoText: { marginLeft: 8, fontSize: 13, color: "#1E3A8A", flex: 1 },
  selectedProductBox: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  selectedProductLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  selectedProductValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#D1D5DB",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: "#111827"
  },
  saveButton: {
    backgroundColor: "#1F2937", flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 12, borderRadius: 8, marginTop: 8
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  productCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    padding: 16, marginHorizontal: 16, marginBottom: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  productCardSelected: { borderColor: "#1F2937", backgroundColor: "#F9FAFB" },
  productName: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
  productNameSelected: { color: "#1F2937" },
  productUnit: { fontSize: 13, color: "#6B7280" },
  stockBadge: { backgroundColor: "#1F2937", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  stockBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" }
});
`;

fs.writeFileSync("app/(drawer)/add-stock/index.tsx", content);
