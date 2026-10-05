import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'nikkibee_mobile_session';

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token, {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
});
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);
