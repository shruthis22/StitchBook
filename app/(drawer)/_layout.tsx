import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';




export default function Layout() {


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <Drawer
        screenOptions={{
          
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



       
      </Drawer>


    </GestureHandlerRootView>


  );
}