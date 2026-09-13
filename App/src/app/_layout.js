import { FontAwesome } from '@expo/vector-icons';
import { useContext } from 'react'; 
import { Stack, Tabs } from 'expo-router';
import { appContext, AppProvider } from '../context/appContext';
import { Drawer } from 'expo-router/drawer';

// 1. O Layout apenas fornece o contexto
export default function RootLayout() {
  return (
    <AppProvider> 
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}