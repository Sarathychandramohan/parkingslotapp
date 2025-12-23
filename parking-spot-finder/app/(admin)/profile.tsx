import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { zoneService, adminBookingService } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';
import ThemeSwitcher from '~/components/ThemeSwitcher';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [hasZone, setHasZone] = useState(true);

  const [stats, setStats] = useState({
    zoneName: '',
    totalSlots: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // 1️⃣ ALWAYS check zone first
      const zone = await zoneService.getMyZone();

      // 🅿️ NO ZONE → EMPTY STATE
      if (!zone) {
        setHasZone(false);
        setStats({
          zoneName: '',
          totalSlots: 0,
          totalBookings: 0,
          totalRevenue: 0,
        });
        return;
      }

      setHasZone(true);

      const bookingStats: any = await adminBookingService.getBookingStats();

      setStats({
        zoneName: zone.name,
        totalSlots: zone.total_slots,
        totalBookings: bookingStats?.total_bookings || 0,
        totalRevenue: bookingStats?.total_revenue || 0,
      });
    } catch (error) {
      // No-zone is NOT an error, log silently
      console.warn('Profile stats fetch skipped:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User Info */}
      <View style={[styles.userSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.name || 'Admin'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>
      </View>

      {/* Zone Info */}
      {!hasZone ? (
        <View style={[styles.zoneEmpty, { backgroundColor: colors.card }]}>
          <Ionicons
            name="business-outline"
            size={40}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.zoneEmptyText, { color: colors.textSecondary }]}
          >
            No parking zone created yet
          </Text>
        </View>
      ) : (
        <View style={[styles.zoneCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.zoneName, { color: colors.text }]}>
            {stats.zoneName}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            Slots: {stats.totalSlots} | Bookings: {stats.totalBookings}
          </Text>
        </View>
      )}

      {/* Theme */}
      <ThemeSwitcher />

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.danger }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={20} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  userSection: { padding: 24, alignItems: 'center', marginBottom: 16 },
  userName: { fontSize: 22, fontWeight: 'bold' },
  userEmail: { fontSize: 14 },
  zoneCard: { margin: 16, padding: 16, borderRadius: 12 },
  zoneName: { fontSize: 18, fontWeight: 'bold' },
  zoneEmpty: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  zoneEmptyText: { marginTop: 8 },
  logoutButton: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { marginLeft: 8, fontWeight: '600' },
});
