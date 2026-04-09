export * from './colors';
export * from './typography';
export * from './spacing';

export const APP_NAME = 'TallyDekho';

export const API_BASE_URL = __DEV__
  ? 'http://192.168.29.241:3001'
  : 'https://api.tallydekho.com';

export const WS_URL = __DEV__
  ? 'ws://192.168.29.241:3001'
  : 'wss://api.tallydekho.com';

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
