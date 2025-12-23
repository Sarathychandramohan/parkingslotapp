import { API_BASE_URL, API_ENDPOINTS, buildApiUrl, handleApiError } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generic API request handler
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  const token = await AsyncStorage.getItem('token');

  const headers: HeadersInit = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(API_BASE_URL + url, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized');
    }
    throw new Error(data?.detail || 'Request failed');
  }

  return data;
}

// ============================================
// PARKING ZONE SERVICES
// ============================================

export interface ParkingZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  available_slots: number;
  admin_id: number;
}

export const zoneService = {
  // Get all zones
  getAllZones: () => apiRequest<ParkingZone[]>(API_ENDPOINTS.ZONES),

  // Search zones by name
  searchZones: (name: string) =>
    apiRequest<ParkingZone[]>(buildApiUrl(API_ENDPOINTS.ZONES_SEARCH, { name })),

  // Get nearby zones
  getNearbyZones: (latitude: number, longitude: number, radius_km = 5) =>
    apiRequest<ParkingZone[]>(
      buildApiUrl(API_ENDPOINTS.ZONES_NEARBY, { latitude, longitude, radius_km })
    ),

  // Admin: Create zone
  createZone: (data: {
    name: string;
    latitude: number;
    longitude: number;
    total_slots: number;
  }) =>
    apiRequest(API_ENDPOINTS.ZONES, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin: Get my zone
  getMyZone: () => apiRequest<ParkingZone>(API_ENDPOINTS.MY_ZONE),

  // Admin: Update availability
  updateAvailability: (zoneId: number, available_slots: number) =>
    apiRequest(API_ENDPOINTS.ZONE_AVAILABILITY(zoneId), {
      method: 'PATCH',
      body: JSON.stringify({ available_slots }),
    }),
};

// ============================================
// PARKING SLOT SERVICES (ADMIN)
// ============================================

export interface ParkingSlot {
  id: number;
  slot_number: string;
  vehicle_type: 'car' | 'bike' | 'truck';
  status: 'available' | 'occupied';
  price_per_hour: number;
  zone_id: number;
}

export const slotService = {
  // Get all slots for a zone
getZoneSlots: async (zoneId: number) => {
  const res: any = await apiRequest(API_ENDPOINTS.SLOTS(zoneId));

  // 🔥 YOUR BACKEND RETURNS AN ARRAY
  if (Array.isArray(res)) {
    return res;
  }

  // (safe fallback if backend ever changes)
  if (res?.slots && Array.isArray(res.slots)) {
    return res.slots;
  }

  return [];
},

  // Create single slot
  createSlot: (
    zoneId: number,
    data: {
      slot_number: string;
      vehicle_type: 'car' | 'bike' | 'truck';
      price_per_hour: number;
    }
  ) =>
    apiRequest(API_ENDPOINTS.SLOTS(zoneId), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update slot status
  updateSlotStatus: (zoneId: number, slotId: number, status: 'available' | 'occupied') =>
    apiRequest(API_ENDPOINTS.SLOT_STATUS(zoneId, slotId), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Get slot statistics
  getSlotStats: (zoneId: number) => apiRequest(API_ENDPOINTS.SLOT_STATS(zoneId)),

  // Delete slot
  deleteSlot: (zoneId: number, slotId: number) =>
    apiRequest(API_ENDPOINTS.SLOTS(zoneId) + `/${slotId}`, {
      method: 'DELETE',
    }),
};

// ============================================
// BOOKING SERVICES (DRIVER)
// ============================================

export interface Booking {
  id: number;
  user_id: number;
  zone_id: number;
  slot_id: number | null;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'completed' | 'cancelled';
  amount_paid: number;
  duration_hours: number;
  zone_name?: string;
  slot_number?: string;
}

export interface DriverStats {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_amount_spent: number;
  total_hours_parked: number;
}

export const bookingService = {
  // Create booking
  createBooking: (data: { zone_id: number; slot_id?: number; duration_hours: number }) =>
    apiRequest(API_ENDPOINTS.BOOKINGS, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get active booking
  getActiveBooking: () => apiRequest<Booking>(API_ENDPOINTS.ACTIVE_BOOKING),

  // Extend booking
  extendBooking: (bookingId: number, additional_hours: number) =>
    apiRequest(API_ENDPOINTS.BOOKING_EXTEND(bookingId), {
      method: 'PATCH',
      body: JSON.stringify({ additional_hours }),
    }),

  // Complete booking
  completeBooking: (bookingId: number) =>
    apiRequest(API_ENDPOINTS.BOOKING_COMPLETE(bookingId), {
      method: 'PATCH',
    }),

  // Cancel booking
  cancelBooking: (bookingId: number) =>
    apiRequest(API_ENDPOINTS.BOOKING_CANCEL(bookingId), {
      method: 'PATCH',
    }),

  // Get booking history
  getBookingHistory: (filters?: { status?: string; limit?: number; skip?: number }) =>
    apiRequest<Booking[]>(buildApiUrl(API_ENDPOINTS.BOOKING_HISTORY, filters)),

  // Get driver stats
  getDriverStats: () => apiRequest<DriverStats>(API_ENDPOINTS.PROFILE_STATS),
};

// ============================================
// ADMIN BOOKING SERVICES
// ============================================

export const adminBookingService = {
  // Get all bookings for admin's zone
  getZoneBookings: (filters?: { status?: string; limit?: number; skip?: number }) =>
    apiRequest<Booking[]>(buildApiUrl(API_ENDPOINTS.ADMIN_BOOKINGS, filters)),

  // Get booking statistics
  getBookingStats: () => apiRequest(API_ENDPOINTS.ADMIN_BOOKING_STATS),
};