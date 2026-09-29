import Constants from 'expo-constants';

// Simulator: localhost. Android emulator: 10.0.2.2. Phone: your computer's LAN IP.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
