import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { api, clearToken, getToken, saveToken } from './api';
import { configureGoogle, getGoogleIdToken, signOutGoogle } from './google-auth';
import type { Cart, CartItem, Delivery, Order, Product, User } from './types';

const EMPTY_CART: Cart = { items: [], count: 0, subtotal: 0 };
const GUEST_CART_KEY = 'nikkibee_guest_cart_v1';
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (webClientId) configureGoogle(webClientId);

type StoreValue = {
  products: Product[]; cart: Cart; favourites: string[]; orders: Order[]; user: User | null;
  loading: boolean; error: string; refresh: () => Promise<void>; addToCart: (product: Product, size: string) => Promise<void>;
  changeQuantity: (item: CartItem, quantity: number) => Promise<void>; removeItem: (item: CartItem) => Promise<void>;
  toggleFavourite: (id: string) => Promise<boolean>; signIn: () => Promise<void>; signOut: () => Promise<void>;
  placeOrder: (delivery: Delivery) => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);
const cartFromItems = (items: CartItem[]): Cart => ({ items, count: items.reduce((n, item) => n + item.quantity, 0), subtotal: items.reduce((n, item) => n + item.price * item.quantity, 0) });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGuestCart = useCallback(async () => {
    const stored = await AsyncStorage.getItem(GUEST_CART_KEY);
    const items: CartItem[] = stored ? JSON.parse(stored) : [];
    setCart(cartFromItems(items));
  }, []);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const catalogue = await api<{ products: Product[] }>('/api/products');
      setProducts(catalogue.products);
      const token = await getToken();
      if (!token) { setUser(null); setFavourites([]); setOrders([]); await loadGuestCart(); return; }
      const [session, bag, saved, history] = await Promise.all([
        api<{ user: User }>('/api/mobile/auth/session'), api<Cart>('/api/cart'),
        api<{ favourites: string[] }>('/api/favourites'), api<{ orders: Order[] }>('/api/orders'),
      ]);
      setUser(session.user); setCart(bag); setFavourites(saved.favourites); setOrders(history.orders);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The store could not be loaded.';
      if (message.includes('expired')) { await clearToken(); setUser(null); await loadGuestCart(); }
      else setError(message);
    } finally { setLoading(false); }
  }, [loadGuestCart]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveGuest = async (items: CartItem[]) => { await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items)); setCart(cartFromItems(items)); };

  const addToCart = async (product: Product, size: string) => {
    if (user) { setCart(await api<Cart>('/api/cart', { method: 'POST', body: JSON.stringify({ productId: product.id, size, quantity: 1 }) })); return; }
    const key = `${product.id}:${size}`;
    const existing = cart.items.find((item) => item.id === key);
    const items = existing
      ? cart.items.map((item) => item.id === key ? { ...item, quantity: item.quantity + 1, lineTotal: item.price * (item.quantity + 1) } : item)
      : [...cart.items, { id: key, productId: product.id, name: product.name, image: product.image, color: product.color, size, price: product.price, quantity: 1, lineTotal: product.price }];
    await saveGuest(items);
  };

  const changeQuantity = async (item: CartItem, quantity: number) => {
    if (user) { setCart(await api<Cart>('/api/cart', { method: 'PATCH', body: JSON.stringify({ itemId: item.id, quantity }) })); return; }
    await saveGuest(quantity < 1 ? cart.items.filter((line) => line.id !== item.id) : cart.items.map((line) => line.id === item.id ? { ...line, quantity, lineTotal: line.price * quantity } : line));
  };
  const removeItem = (item: CartItem) => changeQuantity(item, 0);

  const toggleFavourite = async (id: string) => {
    if (!user) return false;
    const saved = favourites.includes(id);
    const result = await api<{ favourites: string[] }>('/api/favourites', { method: saved ? 'DELETE' : 'POST', body: JSON.stringify({ productId: id }) });
    setFavourites(result.favourites); return true;
  };

  const signIn = async () => {
    if (!webClientId) throw new Error('Google Sign-In needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    const idToken = await getGoogleIdToken();
    if (!idToken) return;
    const auth = await api<{ token: string; user: User }>('/api/mobile/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) });
    await saveToken(auth.token); setUser(auth.user);
    const guestItems = cart.items;
    for (const item of guestItems) await api('/api/cart', { method: 'POST', body: JSON.stringify({ productId: item.productId, size: item.size, quantity: item.quantity }) });
    await AsyncStorage.removeItem(GUEST_CART_KEY);
    await refresh();
  };

  const signOut = async () => {
    try { await api('/api/mobile/auth/session', { method: 'DELETE' }); } catch {}
    await Promise.all([clearToken(), signOutGoogle()]);
    setUser(null); setFavourites([]); setOrders([]); setCart(EMPTY_CART);
  };

  const placeOrder = async (delivery: Delivery) => {
    if (!user) throw new Error('Sign in is required.');
    await api('/api/orders', { method: 'POST', body: JSON.stringify(delivery) });
    const [bag, history] = await Promise.all([api<Cart>('/api/cart'), api<{ orders: Order[] }>('/api/orders')]);
    setCart(bag); setOrders(history.orders);
  };

  const value = useMemo(() => ({ products, cart, favourites, orders, user, loading, error, refresh, addToCart, changeQuantity, removeItem, toggleFavourite, signIn, signOut, placeOrder }), [products, cart, favourites, orders, user, loading, error, refresh]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('StoreProvider is missing.');
  return value;
}

export const showError = (cause: unknown) => Alert.alert('Something went wrong', cause instanceof Error ? cause.message : 'Please try again.');
