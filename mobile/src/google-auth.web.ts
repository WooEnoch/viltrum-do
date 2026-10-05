export function configureGoogle() {}

export async function getGoogleIdToken(): Promise<string | null> {
  throw new Error('Google Sign-In is available in the Android app.');
}

export const signOutGoogle = () => Promise.resolve();
