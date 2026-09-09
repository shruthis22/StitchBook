const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/parties/[id].tsx", "utf8");

// 1. Add imports at top
content = content.replace(
  "import React, { useState } from \x27react\x27;",
  "import React, { useState } from \x27react\x27;\nimport DateTimePicker from \x27@react-native-community/datetimepicker\x27;\nimport { printPartyLedger } from \x27../../../utils/printPartyLedger\x27;"
);

// 2. Add state after existing state declarations
content = content.replace(
  "const [isSaving, setIsSaving] = useState(false);",
  `const [isSaving, setIsSaving] = useState(false);

  // Ledger date range state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLedger = async () => {
    if (!fromDate || !toDate) {
      Alert.alert("Select Dates", "Please select both From and To dates.");
      return;
    }
    if (fromDate > toDate) {
      Alert.alert("Invalid Range", "From date must be before To date.");
      return;
    }

    // Filter bills within range
    const fromTime = new Date(fromDate); fromTime.setHours(0, 0, 0, 0);
    const toTime = new Date(toDate); toTime.setHours(23, 59, 59, 999);

    const filteredBills = partyBills.filter(b => {
      const bDate = new Date(b.date);
      return bDate >= fromTime && bDate <= toTime;
    });

    if (filteredBills.length === 0) {
      Alert.alert("No Bills", "No bills found in the selected date range.");
      return;
    }

    setIsGenerating(true);
    try {
      await printPartyLedger({ partyName: name as string, fromDate, toDate, bills: filteredBills });
    } catch (e: any) {
      Alert.alert("Error", "Failed to generate ledger: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };`
);

// 3. Add ledger section in JSX after the "Add Old Balance" button block
const addOldBalanceButtonMark = `{/* Add Old Balance Button */}`;
const ledgerSection = `{/* Ledger Date Range */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1F2937", marginBottom: 10 }}>Generate Party Ledger</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#1F2937" style={{ marginRight: 6 }} />
              <Text style={styles.dateBtnText}>{fromDate ? fromDate.toLocaleDateString("en-GB") : "From Date"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#1F2937" style={{ marginRight: 6 }} />
              <Text style={styles.dateBtnText}>{toDate ? toDate.toLocaleDateString("en-GB") : "To Date"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.oldBalanceBtn, { backgroundColor: fromDate && toDate ? "#1F2937" : "#9CA3AF" }]}
            onPress={handleGenerateLedger}
            disabled={!fromDate || !toDate || isGenerating}
          >
            {isGenerating ? <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} /> : <Ionicons name="document-text-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />}
            <Text style={styles.oldBalanceBtnText}>{isGenerating ? "Generating..." : "Generate Ledger"}</Text>
          </TouchableOpacity>

          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display="calendar"
              onChange={(_, date) => { setShowFromPicker(false); if (date) setFromDate(date); }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display="calendar"
              onChange={(_, date) => { setShowToPicker(false); if (date) setToDate(date); }}
            />
          )}
        </View>

        `;
content = content.replace(addOldBalanceButtonMark, ledgerSection + addOldBalanceButtonMark);

// 4. Add styles
content = content.replace(
  "oldBalanceBtn: {",
  `dateBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#D1D5DB",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10,
  },
  dateBtnText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  oldBalanceBtn: {`
);

fs.writeFileSync("app/(drawer)/parties/[id].tsx", content);
console.log("Done - party ledger UI added");

