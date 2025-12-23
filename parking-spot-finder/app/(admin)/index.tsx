import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { zoneService, slotService, adminBookingService } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';
import { router } from 'expo-router';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasZone, setHasZone] = useState<boolean>(true);

  const [zone, setZone] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1️⃣ ALWAYS check zone first
      const z = await zoneService.getMyZone();

      // 🅿️ NO ZONE → EMPTY STATE
      if (!z) {
        setHasZone(false);
        setZone(null);
        setStats(null);
        return;
      }

      // ✅ ZONE EXISTS
      setHasZone(true);
      setZone(z);

      const slotStats: any = await slotService.getSlotStats(z.id);
      const bookingStats: any = await adminBookingService.getBookingStats();

      setStats({
        zoneName: z.name,
        totalSlots: slotStats?.total_slots || 0,
        availableSlots: slotStats?.available_slots || 0,
        occupiedSlots: slotStats?.occupied_slots || 0,
        totalBookings: bookingStats?.total_bookings || 0,
        activeBookings: bookingStats?.active_bookings || 0,
        totalRevenue: bookingStats?.total_revenue || 0,
        occupancyRate: slotStats?.occupancy_rate || 0,
      });
    } catch (error) {
      if ((error as Error).message !== 'Unauthorized') {
        console.warn('Dashboard error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
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

  // 🅿️ EMPTY STATE — No zone yet
  if (!hasZone) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, padding: 24 }]}>
        <Ionicons name="business-outline" size={72} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No parking zone yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Create your first parking zone to start managing slots and bookings.
        </Text>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(admin)/zones')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Parking Zone</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ NORMAL DASHBOARD
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
          Admin Dashboard
        </Text>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.name || 'Admin'}
        </Text>
      </View>

      {/* Zone Overview */}
      <View style={[styles.zoneCard, { backgroundColor: colors.card }]}>
        <View style={styles.zoneHeader}>
          <Ionicons name="business" size={32} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.zoneTitle, { color: colors.text }]}>
              {stats?.zoneName}
            </Text>
            <Text style={[styles.zoneSubtitle, { color: colors.textSecondary }]}>
              Parking Zone
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(admin)/zones')}>
            <Ionicons name="arrow-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.occupancyBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.occupancyFill,
              {
                width: `${stats?.occupancyRate ?? 0}%`,
                backgroundColor:
                  (stats?.occupancyRate ?? 0) > 80
                    ? colors.danger
                    : (stats?.occupancyRate ?? 0) > 50
                    ? colors.warning
                    : colors.success,
              },
            ]}
          />
        </View>
        <Text style={[styles.occupancyText, { color: colors.textSecondary }]}>
          {stats?.occupancyRate ?? 0}% Occupied
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Slots', value: stats?.totalSlots, icon: 'grid', color: colors.primary },
          { label: 'Available', value: stats?.availableSlots, icon: 'checkmark-circle', color: colors.success },
          { label: 'Occupied', value: stats?.occupiedSlots, icon: 'close-circle', color: colors.danger },
          { label: 'Active Bookings', value: stats?.activeBookings, icon: 'calendar', color: colors.warning },
        ].map((item, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {item.value ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { padding: 20 },
  welcomeText: { fontSize: 14 },
  userName: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  zoneCard: { margin: 16, padding: 20, borderRadius: 12 },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  zoneTitle: { fontSize: 20, fontWeight: 'bold' },
  zoneSubtitle: { fontSize: 14 },

  occupancyBar: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  occupancyFill: { height: '100%' },
  occupancyText: { textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 24 },
  statCard: { width: '47%', margin: '1.5%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 14 },

  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  createButton: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
