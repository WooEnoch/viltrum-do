# NikkiBee mobile

Expo React Native storefront using the same Next.js API and Neon catalogue as the web app.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the existing Google OAuth Web client ID. Never add a client secret to the mobile app.
3. Run `npm start`, or `npm run android` with an Android development build.

Google Sign-In uses native code and requires a development build or APK rather than Expo Go.

## APK build

1. Run `npx eas-cli login` and `npx eas-cli init` once.
2. In Google Cloud, add an Android OAuth client for package `com.nikkibee.store` with the SHA-1 certificate fingerprint shown by `eas credentials -p android`.
3. Add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the EAS `preview` environment.
4. Run `npm run build:apk`.

The preview profile produces a directly downloadable Android `.apk`.
