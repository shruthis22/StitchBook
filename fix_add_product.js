const fs = require('fs');
const path = 'app/(drawer)/add/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const badStructure = `                <View style={styles.inputGroup}>
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
  
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit</Text>`;

const goodStructure = `                <View style={styles.inputGroup}>
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
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                    Select how this product is quantified (e.g. Sun 90 = Box, Detonators = Nos)
                  </Text>`;

if (code.includes('Default Price (INR)')) {
    // let's do a manual string replace to be super safe
    let s = code.indexOf('<Text style={styles.label}>Default Price (INR)</Text>');
    let e = code.indexOf('<Text style={styles.label}>Unit</Text>');
    if (s !== -1 && e !== -1) {
        // we can replace the section between priceContainer closing and Unit
        code = code.replace(
            /editable=\{!isSaving\}\r?\n\s*\/>\r?\n\s*<\/View>\r?\n\s*<View style=\{styles\.inputGroup\}>\r?\n\s*<Text style=\{styles\.label\}>Unit<\/Text>/,
            `editable={!isSaving}
                    />
                  </View>
                </View>
  
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Selling Unit</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                    Select how this product is quantified (e.g., Sun 90 = Box, Detonators = Nos)
                  </Text>`
        );
        
        // Also we need to remove the extra </View> that was closing the price inputGroup lower down
        code = code.replace(
            /<\/View>\r?\n\s*<\/View>\r?\n\s*\{\/\* Save Button inside the card for better flow \*\/\}/,
            `</View>\n\n                {/* Save Button inside the card for better flow */}`
        );
        
        fs.writeFileSync(path, code, 'utf8');
        console.log('Fixed add product structure');
    }
}
