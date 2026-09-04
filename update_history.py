import os
filepath = r'app\(drawer)\history\[id].tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("backgroundColor: '#059669'", "backgroundColor: '#1F2937'")

if 'const [paymentMethod, setPaymentMethod]' not in content:
    content = content.replace(
        "const [paymentAmount, setPaymentAmount] = useState('');",
        "const [paymentAmount, setPaymentAmount] = useState('');\n  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');"
    )

old_history = '''
    const newHistoryEntry = {
      date: new Date().toISOString(),
      amount: newPayment
    };
'''
new_history = '''
    const newHistoryEntry = {
      date: new Date().toISOString(),
      amount: newPayment,
      method: paymentMethod
    };
'''
content = content.replace(old_history.strip(), new_history.strip())

old_modal_input = '''
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount received"
                autoFocus
              />
'''
new_modal_input = '''
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount received"
                autoFocus
              />

              <Text style={styles.labelMeta}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
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
'''
if 'Payment Method' not in content:
    content = content.replace(old_modal_input.strip(), new_modal_input.strip())

content = content.replace("setPaymentAmount('');", "setPaymentAmount('');\n      setPaymentMethod('Cash');")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated successfully')
