import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { addProduct } from '../../../redux/billSlice';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {DrawerActions} from "@react-navigation/native";








export default function AddProductScreen() {

  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleSave = () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    dispatch(addProduct({
      id: Date.now().toString(),
      name,
      price
    }));
    
    Alert.alert('Success', 'Product added successfully');
    setName('');
    setPrice('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" /> 
          {/* Note: Screenshot has back arrow, but drawer nav usually has menu. Using arrow for visual match */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{width: 24}} /> 
      </View>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Engine Oil 5L"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
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
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#FFF" style={{marginRight: 8}} />
          <Text style={styles.saveButtonText}>Save Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827' 
  },
  card: {
    backgroundColor: '#FFF', 
    margin: 16, 
    borderRadius: 12, 
    padding: 16,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2,
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    
    color: '#374151', 
    marginBottom: 8 
  },
  input: {
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8,
    padding: 12, 
    fontSize: 16, 
    color: '#111827',
  },
  priceContainer: { 
    position: 'relative', 
    justifyContent: 'center' 
  },
  currencySymbol: { 
    position: 'absolute', 
    left: 12, zIndex: 1, 
    color: '#6B7280', 
    fontSize: 16 
  },
  priceInput: { 
    paddingLeft: 30 
  },
  footer: { 
    padding: 16, 
    position: 'absolute', 
    bottom: 0, width: '100%', 
    backgroundColor: '#FFF' 
  },
  saveButton: {
    backgroundColor: '#3B82F6', 
    borderRadius: 8, 
    padding: 16,
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  saveButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});