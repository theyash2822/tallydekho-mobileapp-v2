import apiClient from './client';

export const authApi = {
  sendOTP: (mobile: string) =>
    apiClient.post('/auth/send-otp', { mobile }),

  verifyOTP: (mobile: string, otp: string) =>
    apiClient.post<{
      token: string;
      user: { id: number; name: string; mobile: string };
      isNewUser: boolean;
    }>('/auth/verify-otp', { mobile, otp }),

  updateProfile: (name: string) =>
    apiClient.post('/auth/update-profile', { name }),

  getCompany: () =>
    apiClient.get('/auth/company'),
};
