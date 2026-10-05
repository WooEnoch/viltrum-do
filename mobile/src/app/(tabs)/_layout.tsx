import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { colors } from '../../theme';

const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = { index: ['home-outline', 'home'], shop: ['grid-outline', 'grid'], saved: ['heart-outline', 'heart'], bag: ['bag-outline', 'bag'], account: ['person-circle-outline', 'person-circle'] };

export default function TabLayout() {
  const { cart, favourites } = useStore(); const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarIcon: ({ focused, color, size }) => <Ionicons name={icons[route.name][focused ? 1 : 0]} color={color} size={size} />, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#767680', tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarStyle: { height: 57 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 7), borderTopColor: '#D1D1D6', backgroundColor: 'rgba(250,250,252,.98)' } })}><Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="shop" options={{ title: 'Shop' }} /><Tabs.Screen name="saved" options={{ title: 'Saved', tabBarBadge: favourites.length || undefined, tabBarBadgeStyle: { backgroundColor: colors.blue } }} /><Tabs.Screen name="bag" options={{ title: 'Bag', tabBarBadge: cart.count || undefined, tabBarBadgeStyle: { backgroundColor: colors.blue } }} /><Tabs.Screen name="account" options={{ title: 'Account' }} /></Tabs>;
}
