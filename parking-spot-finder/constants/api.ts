// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',

  // Parking Zones
  ZONES: '/parking/zones',
  ZONES_SEARCH: '/parking/zones/search',
  ZONES_NEARBY: '/parking/zones/nearby',
  MY_ZONE: '/parking/zones/my-zone',
  ZONE_AVAILABILITY: (zoneId: number) => `/parking/zones/${zoneId}/availability`,

  // Slots (Admin)
  SLOTS: (zoneId: number) => `/parking/zones/${zoneId}/slots`,
  SLOT_STATUS: (zoneId: number, slotId: number) => `/parking/zones/${zoneId}/slots/${slotId}/status`,
  SLOT_STATS: (zoneId: number) => `/parking/zones/${zoneId}/slots/stats`,

  // Bookings (Driver)
  BOOKINGS: '/parking/bookings',
  ACTIVE_BOOKING: '/parking/bookings/active',
  BOOKING_EXTEND: (bookingId: number) => `/parking/bookings/${bookingId}/extend`,
  BOOKING_COMPLETE: (bookingId: number) => `/parking/bookings/${bookingId}/complete`,
  BOOKING_CANCEL: (bookingId: number) => `/parking/bookings/${bookingId}/cancel`,
  BOOKING_HISTORY: '/parking/bookings/history',
  PROFILE_STATS: '/parking/profile/stats',

  // Admin Bookings
  ADMIN_BOOKINGS: '/parking/admin/bookings',
  ADMIN_BOOKING_STATS: '/parking/admin/bookings/stats',
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string, params?: Record<string, any>) => {
  const url = new URL(API_BASE_URL + endpoint);
  
  if (params) {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }
    });
  }
  
  return url.toString();
};

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Error handler
export const handleApiError = (error: any): string => {
  if (error.response?.data?.detail) {
    return typeof error.response.data.detail === 'string' 
      ? error.response.data.detail 
      : JSON.stringify(error.response.data.detail);
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};