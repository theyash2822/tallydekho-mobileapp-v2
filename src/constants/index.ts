export * from './colors';
export * from './typography';
export * from './spacing';

export const APP_NAME = 'TallyDekho';

// Android emulator reaches Mac backend at 10.0.2.2
// iOS simulator uses localhost
// Physical device needs actual Mac IP (192.168.x.x)
export const ANDROID_EMULATOR_IP = '10.0.2.2';
export const MAC_LOCAL_IP = '192.168.29.241';

export const API_BASE_URL_ANDROID = `http://${ANDROID_EMULATOR_IP}:3001/app`;
export const API_BASE_URL_IOS = `http://localhost:3001/app`;
export const API_BASE_URL_DEVICE = `http://${MAC_LOCAL_IP}:3001/app`;

// Default — updated in client.ts based on Platform
export const API_BASE_URL = API_BASE_URL_ANDROID;

export const WS_URL = `ws://${ANDROID_EMULATOR_IP}:3001`;

export const STORAGE_KEYS = {
  AUTH_TOKEN:     'authToken',
  USER_DATA:      'userData',
  COMPANY_DATA:   'companyData',
  ONBOARDING:     'onboardingDone',
  SELECTED_FY:    'selectedFY',
  SCREEN_LOCK:    'screenLock',
  PASSKEY:        'passkey',
  PAIRED:         'isPaired',
} as const;
