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
import { adminBookingService, Booking, zoneService } from '~/constants/apiService';
import { Colors } from '~/constants/Colors';
import { router } from 'expo-router';
import AdminCreateZoneGate from '~/components/AdminCreateZoneGate';

export default function AdminManageScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🆕 ZONE STATE
  const [hasZone, setHasZone] = useState<boolean>(true);

  useEffect(() => {
    checkZoneAndFetch();
  }, [activeTab]);

  const checkZoneAndFetch = async () => {
    try {
      setLoading(true);

      // 1️⃣ ALWAYS check zone first
      const zone = await zoneService.getMyZone();

      // 🅿️ NO ZONE → SHOW CREATE ZONE CTA
      if (!zone) {
        setHasZone(false);
        setBookings([]);
        return;
      }

      // ✅ ZONE EXISTS → FETCH BOOKINGS
      setHasZone(true);
      const filters = activeTab === 'all' ? {} : { status: activeTab };
      const data = await adminBookingService.getZoneBookings(filters);
      setBookings(data);
    } catch (error) {
      console.warn('Bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkZoneAndFetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return '#FF5252';
      default:
        return '#999';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#E8F5E9';
      case 'completed':
        return '#E3F2FD';
      case 'cancelled':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // 🅿️ EMPTY STATE — NO ZONE
  if (!hasZone) {
    return <AdminCreateZoneGate>
      {/* You can customize this message or UI as needed */}
      <Text style={{ textAlign: 'center', marginTop: 20 }}>No zone found. Please create a zone to manage bookings.</Text>
    </AdminCreateZoneGate>;
  }

  // ✅ NORMAL MANAGE BOOKINGS UI (UNCHANGED)
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'active', 'completed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingSlot}>Spot {booking.slot_number}</Text>
                  <View style={styles.bookingMeta}>
                    <Ionicons name="person" size={14} color="#666" />
                    <Text style={styles.bookingUserId}>User #{booking.user_id}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(booking.status) },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.detailText}>{formatDate(booking.start_time)}</Text>
                <Text style={styles.detailText}>
                  {formatTime(booking.start_time)} -{' '}
                  {booking.end_time ? formatTime(booking.end_time) : 'Ongoing'}
                </Text>
                <Text style={styles.amountText}>
                  ₹{booking.amount_paid.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES (UNCHANGED) ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.light.primary },
  tabText: { fontSize: 16, color: '#666' },
  tabTextActive: { color: Colors.light.primary, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bookingInfo: { flex: 1 },
  bookingSlot: { fontSize: 18, fontWeight: 'bold' },
  bookingMeta: { flexDirection: 'row', alignItems: 'center' },
  bookingUserId: { marginLeft: 4, fontSize: 14, color: '#666' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  bookingDetails: { gap: 8 },
  detailText: { fontSize: 14, color: '#666' },
  amountText: { fontSize: 16, fontWeight: 'bold', color: Colors.light.primary },
});
