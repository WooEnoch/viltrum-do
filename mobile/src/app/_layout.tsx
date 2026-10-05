import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../store';
import { colors } from '../theme';

export default function RootLayout() {
  return <SafeAreaProvider><StoreProvider><StatusBar style="dark" /><Stack screenOptions={{ headerBackTitle: 'Back', headerTintColor: colors.blue, headerShadowVisible: false, headerStyle: { backgroundColor: colors.card }, headerTitleStyle: { color: colors.ink, fontWeight: '600' } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="product/[productId]" options={{ title: '' }} /><Stack.Screen name="checkout" options={{ title: 'Checkout', presentation: 'modal' }} /><Stack.Screen name="orders" options={{ title: 'Orders' }} /><Stack.Screen name="signin" options={{ title: '', presentation: 'modal' }} /></Stack></StoreProvider></SafeAreaProvider>;
}
