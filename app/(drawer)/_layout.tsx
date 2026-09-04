import { Drawer } from 'expo-router/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { loadAppData } from '../../redux/stitchbookSlice';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { LinearGradient } from 'expo-linear-gradient';

export default function DrawerLayout() {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(loadAppData() as any);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/Login');
  };

  return (
    <Drawer
      screenOptions={{
        headerBackground: () => (
          <LinearGradient colors={['#352A23', '#4A3B32', '#FFCBA4']} locations={[0, 0.8, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        ),
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: '#fff',
        drawerActiveBackgroundColor: '#F2EBE5',
        drawerActiveTintColor: '#4A3B32',
        drawerInactiveTintColor: '#6B5B52',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        )
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="new-order"
        options={{
          title: 'New Order',
          drawerIcon: ({ color }) => <MaterialIcons name="add-circle-outline" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="customers"
        options={{
          title: 'Customers',
          drawerIcon: ({ color }) => <MaterialIcons name="people-outline" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="orders"
        options={{
          title: 'Orders',
          drawerIcon: ({ color }) => <MaterialIcons name="list-alt" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="payments"
        options={{
          title: 'Payments',
          drawerIcon: ({ color }) => <MaterialIcons name="payment" size={24} color={color} />,
        }}
      />
    </Drawer>
  );
}
