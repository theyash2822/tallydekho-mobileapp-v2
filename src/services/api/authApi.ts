import apiClient from './client';

/**
 * Auth API — matches backend routes exactly
 * Backend mounted at /app, routes in auth.js:
 *   POST /app/send-otp   { mobileNumber, countryCode }
 *   POST /app/verify-otp { mobileNumber, otp }
 *   POST /app/me         { name }
 *   GET  /app/me
 */
export const authApi = {
  sendOTP: (mobile: string) =>
    apiClient.post('/send-otp', { mobileNumber: mobile, countryCode: '+91' }),

  verifyOTP: (mobile: string, otp: string) =>
    apiClient.post<{
      status: boolean;
      data: {
        token: string;
        user: { id: number; name: string; mobile: string };
        isNewUser: boolean;
        isPaired: boolean;
      };
    }>('/verify-otp', { mobileNumber: mobile, otp }),

  updateProfile: (name: string) =>
    apiClient.post('/me', { name }),

  getMe: () =>
    apiClient.get('/me'),

  getCompany: () =>
    apiClient.get('/company'),
};
