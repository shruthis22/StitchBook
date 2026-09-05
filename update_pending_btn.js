const fs = require('fs');
const path = 'app/(drawer)/pending-payments/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// Change the icon color
code = code.replace(/<Ionicons name="add-circle-outline" size=\{16\} color="#3B82F6" \/>/g, '<Ionicons name="add-circle-outline" size={16} color="#FFF" />');

// Change the style
const oldStyle = `updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  updateButtonText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' }`;

// If it's different, let's just use regex replacement
code = code.replace(/updateButton:\s*\{[^}]+\}/, `updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    gap: 6,
  }`);

code = code.replace(/updateButtonText:\s*\{[^}]+\}/, "updateButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' }");

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed pending payments button');
