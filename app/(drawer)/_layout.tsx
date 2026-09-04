import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';







function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={{ 
        paddingTop: insets.top + 30, 
        paddingBottom: 30, 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
      }}>
        <View style={{
          width: 80,
          height: 80,
          transform: [{ rotate: '45deg' }],
          overflow: 'hidden',
          backgroundColor: '#000',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3.84,
        }}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ 
              width: 120, 
              height: 120, 
              transform: [{ rotate: '-45deg' }],
              marginLeft: -20,
              marginTop: -20
            }}
            resizeMode="cover"
          />
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: '#FFF', paddingTop: 10 }}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function Layout() {


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />} screenOptions={{
          
          headerShown: false,

          // Drawer styling options
          drawerActiveTintColor: '#3B82F6',
          drawerInactiveTintColor: '#333',
          drawerLabelStyle: {
            marginLeft: -5,
            fontSize: 15,
            
          },
          drawerStyle:{
            width:300,
          }
        }}
      >


       


        <Drawer.Screen
          name="home"

          options={{
            drawerLabel: 'Billing Home',
            title: 'Billing',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}

        />

        <Drawer.Screen
          name="history"

          options={{
            drawerLabel: 'History',
            title: 'History',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="archive-outline" size={size} color={color} />
            ),
            // @ts-ignore
            unmountOnBlur: true,
          }}

        />

        <Drawer.Screen
          name="dashboard"
          options={{
            drawerItemStyle: { display: 'none' },
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="pending-payments"
          options={{
            drawerItemStyle: { display: 'none' },
            drawerLabel: 'Pending Payments',
            title: 'Pending Payments',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="add"
          options={{
            drawerLabel: 'Add Product',
            title: 'Add',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="add-customer"
          options={{
            drawerLabel: 'Add Party',
            title: 'Add Party',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-add-outline" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="add-stock"
          options={{
            drawerLabel: 'Manage Stocks',
            title: 'Manage Stocks',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="parties"
          options={{
            drawerItemStyle: { display: 'none' },
            drawerLabel: 'Parties',
            title: 'Parties',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

      </Drawer>


    </GestureHandlerRootView>


  );
}