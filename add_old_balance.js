const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/parties/[id].tsx", "utf-8");

// 1. Add imports
content = content.replace(
  "import { useSelector } from \x27react-redux\x27;",
  "import { useSelector, useDispatch } from \x27react-redux\x27;\nimport { AppDispatch } from \x27../../../redux/store\x27;\nimport { saveBillToGoogleSheets } from \x27../../../redux/billSlice\x27;\nimport { TextInput, Modal, ActivityIndicator, Alert, ToastAndroid } from \x27react-native\x27;"
);
content = content.replace("import React from \x27react\x27;", "import React, { useState } from \x27react\x27;");

// 2. Add state and handlers
const stateHook = `  const dispatch = useDispatch<AppDispatch>();
  const [showModal, setShowModal] = useState(false);
  const [oldBalance, setOldBalance] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveOldBalance = async () => {
    const numAmt = parseFloat(oldBalance);
    if (!oldBalance || isNaN(numAmt) || numAmt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    setIsSaving(true);
    const dummyBill = {
      id: \`#OLD-\${Math.floor(100000 + Math.random() * 900000)}\`,
      customerName: name as string,
      customerPhone: "",
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "Pending",
      amount: numAmt,
      subtotal: numAmt,
      tax: 0,
      discount: 0,
      grandTotal: numAmt,
      items: [],
      remarks: "Old Balance",
      paymentHistory: [],
      pendingAmount: numAmt
    };

    try {
      await dispatch(saveBillToGoogleSheets(dummyBill as any)).unwrap();
      ToastAndroid.show("Old balance added", ToastAndroid.SHORT);
      setShowModal(false);
      setOldBalance("");
    } catch (error: any) {
      Alert.alert("Error", "Failed to add old balance: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
`;
content = content.replace("  const { bills } = useSelector((state: RootState) => state.billing);", stateHook + "\n  const { bills } = useSelector((state: RootState) => state.billing);");

// 3. Add button below summary cards
const buttonUI = `        </View>
        
        {/* Add Old Balance Button */}
        <TouchableOpacity
          style={styles.oldBalanceBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.oldBalanceBtnText}>Add Old Balance</Text>
        </TouchableOpacity>

        {/* Modal */}
        <Modal visible={showModal} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Old Balance</Text>
              <Text style={styles.modalSubtitle}>for {name}</Text>
              
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="Enter amount (e.g. 5000)"
                value={oldBalance}
                onChangeText={setOldBalance}
                editable={!isSaving}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalBtnCancel} 
                  onPress={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalBtnSave} 
                  onPress={handleSaveOldBalance}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalBtnSaveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>`;
content = content.replace("        </View>\r\n\r\n        {/* Bills count label */}", buttonUI + "\n\n        {/* Bills count label */}");

// 4. Add styles
const newStyles = `
  oldBalanceBtn: {
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  oldBalanceBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  modalInput: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    marginBottom: 24, color: "#111827"
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnCancelText: { color: "#4B5563", fontSize: 15, fontWeight: "600" },
  modalBtnSave: { backgroundColor: "#1F2937", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  modalBtnSaveText: { color: "#FFF", fontSize: 15, fontWeight: "600" }
});`;
content = content.replace("});", newStyles);

fs.writeFileSync("app/(drawer)/parties/[id].tsx", content);
