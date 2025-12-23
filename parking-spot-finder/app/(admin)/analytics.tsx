import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { zoneService, slotService, adminBookingService } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';
import { router } from 'expo-router';

export default function AnalyticsScreen() {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasZone, setHasZone] = useState(true);

  const [analytics, setAnalytics] = useState({
    zoneName: '',
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    occupancyRate: 0,
    carSlots: 0,
    bikeSlots: 0,
    truckSlots: 0,
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    avgBookingDuration: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // 1️⃣ ALWAYS check zone first
      const zone = await zoneService.getMyZone();

      // 🅿️ NO ZONE → EMPTY STATE
      if (!zone) {
        setHasZone(false);
        setAnalytics(prev => ({ ...prev, zoneName: '' }));
        return;
      }

      setHasZone(true);

      // ✅ ZONE EXISTS — fetch once
      const slotStats: any = await slotService.getSlotStats(zone.id);
      const bookingStats: any = await adminBookingService.getBookingStats();

      setAnalytics({
        zoneName: zone.name,
        totalSlots: slotStats?.total_slots || 0,
        availableSlots: slotStats?.available_slots || 0,
        occupiedSlots: slotStats?.occupied_slots || 0,
        occupancyRate: slotStats?.occupancy_rate || 0,
        carSlots: slotStats?.vehicle_types?.car || 0,
        bikeSlots: slotStats?.vehicle_types?.bike || 0,
        truckSlots: slotStats?.vehicle_types?.truck || 0,
        totalBookings: bookingStats?.total_bookings || 0,
        activeBookings: bookingStats?.active_bookings || 0,
        completedBookings: bookingStats?.completed_bookings || 0,
        totalRevenue: bookingStats?.total_revenue || 0,
        avgBookingDuration:
          bookingStats?.average_booking_duration_hours || 0,
      });
    } catch (error) {
      console.warn('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  // ⏳ Loading
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 🚫 EMPTY STATE — NO ZONE
  if (!hasZone) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="analytics-outline" size={72} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No analytics yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Create a parking zone to view analytics
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/zones')}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryButtonText}>Create Parking Zone</Text>
        </TouchableOpacity>

      </View>
    );
  }

  // ✅ NORMAL ANALYTICS UI (UNCHANGED)
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Your existing analytics UI stays EXACTLY the same */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  primaryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
});
