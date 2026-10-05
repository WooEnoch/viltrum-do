import * as SecureStore from 'expo-secure-store';

export const API_ORIGIN = (process.env.EXPO_PUBLIC_API_URL || 'https://viltrum-do-isb3.vercel.app').replace(/\/$/, '');
const TOKEN_KEY = 'nikkibee_mobile_session';

export const imageUrl = (path: string) => `${API_ORIGIN}/assets/nikkibee/${path}`;
export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Please try again.');
  return body as T;
}
