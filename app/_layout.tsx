import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import {store, persistor} from "../redux/store";
import {Text, View} from "react-native";
import { StatusBar } from 'expo-status-bar';






export default function RootLayout() {
  return(
    <Provider store={store}>
      <PersistGate loading={<View><Text>Loading...</Text></View>} persistor={persistor}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Slot />
      </PersistGate>
    </Provider>
  );
}
