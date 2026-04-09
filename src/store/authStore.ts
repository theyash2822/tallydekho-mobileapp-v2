import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { User, Company } from '../types';

interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  isPaired: boolean;
  selectedFY: string;

  // Actions
  setAuth: (token: string, user: User, isNewUser: boolean) => Promise<void>;
  setCompany: (company: Company) => Promise<void>;
  setSelectedFY: (fy: string) => void;
  setPaired: (paired: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  company: null,
  token: null,
  isAuthenticated: false,
  isNewUser: false,
  isPaired: false,
  selectedFY: 'FY 2025-26',

  setAuth: async (token, user, isNewUser) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isNewUser });
  },

  setCompany: async (company) => {
    await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_DATA, JSON.stringify(company));
    set({ company });
  },

  setSelectedFY: (fy) => {
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_FY, fy);
    set({ selectedFY: fy });
  },

  setPaired: async (paired) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PAIRED, String(paired));
    set({ isPaired: paired });
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    await AsyncStorage.removeItem(STORAGE_KEYS.COMPANY_DATA);
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    set({ user: null, company: null, token: null, isAuthenticated: false, isPaired: false });
  },

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const companyRaw = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_DATA);
      const fy = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FY);
      const paired = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED);
      set({
        token: token ?? null,
        user: userRaw ? JSON.parse(userRaw) : null,
        company: companyRaw ? JSON.parse(companyRaw) : null,
        isAuthenticated: !!token,
        selectedFY: fy ?? 'FY 2025-26',
        isPaired: paired === 'true',
      });
    } catch (_) {}
  },
}));
