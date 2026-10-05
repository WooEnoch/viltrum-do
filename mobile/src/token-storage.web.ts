const TOKEN_KEY = 'nikkibee_mobile_session';

export const getToken = () => Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null);
export const saveToken = (token: string) => {
  globalThis.localStorage?.setItem(TOKEN_KEY, token);
  return Promise.resolve();
};
export const clearToken = () => {
  globalThis.localStorage?.removeItem(TOKEN_KEY);
  return Promise.resolve();
};
