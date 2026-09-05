const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/parties/[id].tsx", "utf-8");

const buttonUI = `
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
        </Modal>

`;

content = content.replace(
  /{[\s]*\/\* Bills count label \*\//g,
  buttonUI + "        {/* Bills count label */"
);

fs.writeFileSync("app/(drawer)/parties/[id].tsx", content);

