import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function configureGoogle(webClientId: string) {
  GoogleSignin.configure({ webClientId, offlineAccess: false });
}

export async function getGoogleIdToken() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  return response.type === 'success' ? response.data.idToken : null;
}

export const signOutGoogle = () => GoogleSignin.signOut().then(() => undefined).catch(() => undefined);
