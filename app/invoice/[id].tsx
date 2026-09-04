import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const order = useSelector((state: any) => state.stitchbook.orders.find((o: any) => o.order_id === id));
  const customer = useSelector((state: any) => state.stitchbook.customers.find((c: any) => c.customer_id === order?.customer_id));

  if (!order || !customer) return <Text>Not Found</Text>;

  let orderItems = [];
  try {
    orderItems = JSON.parse(order.order_type);
  } catch (e) {
    orderItems = [{ description: order.order_type, price: order.total_amount }];
  }

  const itemsHtml = orderItems.map((item: any) => `
    <tr>
      <td>${item.description}</td>
      <td>1</td>
      <td style="text-align: right;">₹${item.price}</td>
    </tr>
  `).join('');

  const generateAndSharePDF = async () => {
    try {
      const logoUri = Image.resolveAssetSource(require('../../assets/images/logo_transparent.png')).uri;
      
      const htmlContent = `
        <html>
          <head>
            <style>
              html, body { height: 100%; margin: 0; padding: 0; }
              body { font-family: 'Helvetica Neue', 'Helvetica', sans-serif; padding: 10px; color: #000; font-size: 12px; box-sizing: border-box; }
              .container { border: 1px solid #000; width: 100%; height: 98%; display: flex; flex-direction: column; box-sizing: border-box; }
              table { width: 100%; border-collapse: collapse; }
              td, th { padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000; }
              td:last-child, th:last-child { border-right: none; }
              .no-bottom { border-bottom: none; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              h2, h3, p { margin: 2px 0; }
            </style>
          </head>
          <body>
            <div class="container" style="position: relative; z-index: 1;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; z-index: -1;">
                <img src="${logoUri}" style="width: 400px; height: 400px; object-fit: contain;" />
              </div>
              <table>
                <tr class="no-bottom">
                  <td style="width: 18%; text-align: center; vertical-align: middle; border-right: none;">
                    <img src="${logoUri}" style="width: 100%; max-width: 100px; height: auto;" />
                  </td>
                  <td style="width: 52%; vertical-align: top; padding-left: 0;">
                    <h3 style="color: #4A3B32;">Premium Tailors</h3>
                    <p>123 Fashion Street, Boutique District</p>
                    <p>Cityville, State - 123456</p>
                    <p class="bold">Phone: 9876543210</p>
                  </td>
                  <td style="width: 30%; vertical-align: top;">
                    <p><span class="bold">Bill To:</span> ${customer.name}</p>
                    <p><span class="bold">Phone:</span> ${customer.phone}</p>
                    <p><span class="bold">Bill No:</span> ${order.order_id}</p>
                    <p><span class="bold">Date:</span> ${new Date().toLocaleDateString()}</p>
                  </td>
                </tr>
              </table>

              <div style="flex-grow: 1; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                <table style="height: 100%;">
                  <tr>
                    <th style="width: 8%;">S.No</th>
                    <th style="width: 52%; text-align: left;">Particulars</th>
                    <th style="width: 10%;">Qty</th>
                    <th style="width: 15%;">Rate</th>
                    <th style="width: 15%;">Amount</th>
                  </tr>
                  ${orderItems.map((item: any, i: number) => `
                    <tr class="no-bottom">
                      <td class="text-center" style="border-bottom: none;">${i + 1}</td>
                      <td style="border-bottom: none;">${item.description}</td>
                      <td class="text-center" style="border-bottom: none;">1</td>
                      <td class="text-right" style="border-bottom: none;">${item.price}</td>
                      <td class="text-right" style="border-bottom: none;">${item.price}</td>
                    </tr>
                  `).join('')}
                  <tr style="height: 100%;">
                    <td style="border-bottom: none;"></td>
                    <td style="border-bottom: none;"></td>
                    <td style="border-bottom: none;"></td>
                    <td style="border-bottom: none;"></td>
                    <td style="border-bottom: none;"></td>
                  </tr>
                </table>
              </div>

              <table>
                <tr class="no-bottom">
                  <td style="width: 60%; vertical-align: top; border-right: 1px solid #000; border-bottom: none;">
                    <span class="bold">Remarks:</span><br/>Thank you for your business!
                  </td>
                  <td style="width: 40%; padding: 0; border-bottom: none;">
                    <table style="width: 100%;">
                      <tr>
                        <td class="bold" style="width: 60%; border-top: none;">Total</td>
                        <td class="text-right" style="width: 40%; border-top: none; border-right: none;">${order.total_amount}</td>
                      </tr>
                      <tr>
                        <td class="bold">Advance Paid</td>
                        <td class="text-right" style="border-right: none;">${order.total_paid}</td>
                      </tr>
                      <tr class="no-bottom">
                        <td class="bold" style="border-bottom: none;">Balance</td>
                        <td class="text-right bold" style="border-bottom: none; border-right: none;">${order.balance}</td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin-top: 40px; font-size: 10px; font-style: italic;">Authorized Signature</div>
                  </td>
                </tr>
              </table>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4A3B32' }}>
      <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFF' }]}>Invoice {id}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }} style={{ backgroundColor: '#FAF9F6' }}>
        {/* Invoice Paper */}
        <View style={[styles.paper, { position: 'relative' }]}>
          {/* Watermark Logo */}
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', opacity: 0.1, zIndex: 0 }]} pointerEvents="none">
            <Image source={require('../../assets/images/logo_transparent.png')} style={{ width: 300, height: 300, resizeMode: 'contain' }} />
          </View>

          {/* Top Header Row */}
          <View style={[styles.tRow, { borderBottomWidth: 1 }]}>
            <View style={[styles.tCell, { flex: 0.6, borderRightWidth: 0, justifyContent: 'center', alignItems: 'center', padding: 0 }]}>
              <Image source={require('../../assets/images/logo_transparent.png')} style={{ width: '100%', height: 75, resizeMode: 'contain' }} />
            </View>
            <View style={[styles.tCell, { flex: 1.8, borderRightWidth: 1, justifyContent: 'center', paddingLeft: 0 }]}>
              <Text style={{ color: '#4A3B32', fontWeight: 'bold', fontSize: 11 }}>Premium Tailors</Text>
              <Text style={styles.tText}>123 Fashion Street, Boutique District</Text>
              <Text style={styles.tText}>Cityville, State - 123456</Text>
              <Text style={[styles.tText, { fontWeight: 'bold' }]}>Phone: 9876543210</Text>
            </View>
            <View style={[styles.tCell, { flex: 1.1, justifyContent: 'center', paddingLeft: 8 }]}>
              <Text style={styles.tText}><Text style={{ fontWeight: 'bold' }}>Bill To:</Text> {customer.name}</Text>
              <Text style={styles.tText}><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {customer.phone}</Text>
              <Text style={styles.tText}><Text style={{ fontWeight: 'bold' }}>Bill No:</Text> {order.order_id.slice(-6)}</Text>
              <Text style={styles.tText}><Text style={{ fontWeight: 'bold' }}>Date:</Text> {new Date().toLocaleDateString()}</Text>
            </View>
          </View>

          {/* Table Headers */}
          <View style={[styles.tRow, { borderBottomWidth: 1, backgroundColor: '#f9f9f9' }]}>
            <View style={[styles.tCell, { flex: 0.4, borderRightWidth: 1 }]}><Text style={styles.tHead}>S.No</Text></View>
            <View style={[styles.tCell, { flex: 2, borderRightWidth: 1 }]}><Text style={styles.tHead}>Particulars</Text></View>
            <View style={[styles.tCell, { flex: 0.6, borderRightWidth: 1 }]}><Text style={[styles.tHead, { textAlign: 'center' }]}>Qty</Text></View>
            <View style={[styles.tCell, { flex: 0.9, borderRightWidth: 1 }]}><Text style={[styles.tHead, { textAlign: 'right' }]}>Rate</Text></View>
            <View style={[styles.tCell, { flex: 0.9 }]}><Text style={[styles.tHead, { textAlign: 'right' }]}>Amount</Text></View>
          </View>

          {/* Items */}
          {orderItems.map((item: any, i: number) => (
            <View key={i} style={styles.tRow}>
              <View style={[styles.tCell, { flex: 0.4, borderRightWidth: 1 }]}><Text style={[styles.tText, { textAlign: 'center' }]}>{i + 1}</Text></View>
              <View style={[styles.tCell, { flex: 2, borderRightWidth: 1 }]}><Text style={styles.tText}>{item.description}</Text></View>
              <View style={[styles.tCell, { flex: 0.6, borderRightWidth: 1 }]}><Text style={[styles.tText, { textAlign: 'center' }]}>1</Text></View>
              <View style={[styles.tCell, { flex: 0.9, borderRightWidth: 1 }]}><Text style={[styles.tText, { textAlign: 'right' }]}>{item.price}</Text></View>
              <View style={[styles.tCell, { flex: 0.9 }]}><Text style={[styles.tText, { textAlign: 'right' }]}>{item.price}</Text></View>
            </View>
          ))}
          
          <View style={[styles.tRow, { flex: 1, minHeight: 250 }]}>
             <View style={[styles.tCell, { flex: 0.4, borderRightWidth: 1 }]} />
             <View style={[styles.tCell, { flex: 2, borderRightWidth: 1 }]} />
             <View style={[styles.tCell, { flex: 0.6, borderRightWidth: 1 }]} />
             <View style={[styles.tCell, { flex: 0.9, borderRightWidth: 1 }]} />
             <View style={[styles.tCell, { flex: 0.9 }]} />
          </View>

          {/* Totals Section */}
          <View style={[styles.tRow, { borderTopWidth: 1 }]}>
            <View style={[styles.tCell, { flex: 1.5, borderRightWidth: 1 }]}>
              <Text style={[styles.tText, { fontStyle: 'italic', color: '#666' }]}>Remarks:</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={[styles.tRow, { borderBottomWidth: 1 }]}>
                <View style={[styles.tCell, { flex: 1, borderRightWidth: 1 }]}><Text style={[styles.tText, { fontWeight: 'bold' }]}>Total</Text></View>
                <View style={[styles.tCell, { flex: 1 }]}><Text style={[styles.tText, { textAlign: 'right', fontWeight: 'bold' }]}>{order.total_amount}</Text></View>
              </View>
              <View style={[styles.tRow, { borderBottomWidth: 1 }]}>
                <View style={[styles.tCell, { flex: 1, borderRightWidth: 1 }]}><Text style={styles.tText}>Advance Paid</Text></View>
                <View style={[styles.tCell, { flex: 1 }]}><Text style={[styles.tText, { textAlign: 'right' }]}>{order.total_paid}</Text></View>
              </View>
              <View style={styles.tRow}>
                <View style={[styles.tCell, { flex: 1, borderRightWidth: 1 }]}><Text style={[styles.tText, { fontWeight: 'bold' }]}>Balance</Text></View>
                <View style={[styles.tCell, { flex: 1 }]}><Text style={[styles.tText, { textAlign: 'right', fontWeight: 'bold' }]}>{order.balance}</Text></View>
              </View>
            </View>
          </View>

          <View style={[styles.tRow, { borderTopWidth: 1 }]}>
            <View style={[styles.tCell, { flex: 1, alignItems: 'flex-end', paddingRight: 20, paddingTop: 30 }]}>
              <Text style={[styles.tText, { fontStyle: 'italic' }]}>Authorized Signature</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={generateAndSharePDF}>
          <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="share" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.btnSolidText}>Share PDF Invoice</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E6E2DD' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3B32' },
  paper: { 
    backgroundColor: '#fff', 
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
    minHeight: 600
  },
  tRow: { flexDirection: 'row' },
  tCell: { padding: 5, borderColor: '#000' },
  tHead: { fontWeight: 'bold', fontSize: 10, color: '#000' },
  tText: { fontSize: 10, color: '#000' },
  btnSolid: { flexDirection: 'row', backgroundColor: '#4A3B32', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSolidText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
