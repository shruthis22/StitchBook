const fs = require("fs");

// Copy history/[id].tsx to parties/bill-detail.tsx
const src = fs.readFileSync("app/(drawer)/history/[id].tsx", "utf8");

// No changes needed - router.back() will go back within the parties stack correctly
fs.writeFileSync("app/(drawer)/parties/bill-detail.tsx", src);

// Update parties/_layout.tsx to include bill-detail
const layout = `import React from "react"; import { Stack } from "expo-router"; export default function Layout(){ return (<Stack><Stack.Screen name="index" options={{headerShown: false}} /><Stack.Screen name="[id]" options={{headerShown: false}} /><Stack.Screen name="bill-detail" options={{headerShown: false}} /></Stack>); }`;
fs.writeFileSync("app/(drawer)/parties/_layout.tsx", layout);

// Update parties/[id].tsx to push to bill-detail within parties stack
let partyDetail = fs.readFileSync("app/(drawer)/parties/[id].tsx", "utf8");
partyDetail = partyDetail.replace(
  "router.push({ pathname: \x27/(drawer)/history/[id]\x27, params: { id: item.id } })",
  "router.push({ pathname: \x27/(drawer)/parties/bill-detail\x27, params: { id: item.id } })"
);
fs.writeFileSync("app/(drawer)/parties/[id].tsx", partyDetail);

console.log("Done: bill-detail created, layout updated, [id].tsx updated");

