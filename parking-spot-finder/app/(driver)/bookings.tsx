import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService, Booking } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';

export default function BookingsScreen() {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      if (activeTab === 'active') {
        try {
          const data = await bookingService.getActiveBooking();
          setActiveBooking(data);
        } catch (error: any) {
          setActiveBooking(null);
        }
      } else {
        const data = await bookingService.getBookingHistory({ limit: 20 });
        setBookingHistory(data);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleExtend = async () => {
    if (!activeBooking) return;
    Alert.prompt(
      'Extend Booking',
      'How many additional hours?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Extend',
          onPress: async (hours) => {
            try {
              const additional_hours = parseInt(hours || '1');
              await bookingService.extendBooking(activeBooking.id, additional_hours);
              Alert.alert('Success', 'Booking extended successfully');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
      'plain-text',
      '1'
    );
  };

  const handleCancel = async () => {
    if (!activeBooking) return;
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingService.cancelBooking(activeBooking.id);
            Alert.alert('Success', 'Booking cancelled');
            fetchBookings();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleComplete = async () => {
    if (!activeBooking) return;
    Alert.alert('Complete Booking', 'Mark this booking as completed?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Complete',
        onPress: async () => {
          try {
            await bookingService.completeBooking(activeBooking.id);
            Alert.alert('Success', 'Booking completed successfully');
            fetchBookings();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? colors.primary : colors.textSecondary }]}>
            Active (1)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.primary : colors.textSecondary }]}>
            History ({bookingHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'active' ? (
            activeBooking ? (
              <View style={[styles.activeBookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.bookingHeader}>
                  <Text style={[styles.bookingZone, { color: colors.text }]}>{activeBooking.zone_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.statusText, { color: colors.success }]}>Active</Text>
                  </View>
                </View>

                <View style={styles.bookingDetail}>
                  <Ionicons name="car" size={20} color={colors.textSecondary} />
                  <Text style={[styles.bookingSlot, { color: colors.text }]}>Spot {activeBooking.slot_number}</Text>
                </View>

                <View style={styles.bookingDetail}>
                  <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                  <Text style={[styles.bookingText, { color: colors.textSecondary }]}>Today</Text>
                </View>

                <View style={styles.bookingDetail}>
                  <Ionicons name="time" size={20} color={colors.textSecondary} />
                  <Text style={[styles.bookingText, { color: colors.textSecondary }]}>
                    {formatTime(activeBooking.start_time)} -{' '}
                    {activeBooking.end_time ? formatTime(activeBooking.end_time) : 'N/A'}
                  </Text>
                </View>

                <View style={styles.bookingDetail}>
                  <Ionicons name="hourglass" size={20} color={colors.textSecondary} />
                  <Text style={[styles.bookingText, { color: colors.textSecondary }]}>{activeBooking.duration_hours} hours</Text>
                </View>

                <View style={styles.bookingDetail}>
                  <Ionicons name="cash" size={20} color={colors.textSecondary} />
                  <Text style={[styles.bookingPrice, { color: colors.primary }]}>₹{activeBooking.amount_paid}</Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.danger + '20' }]} onPress={handleCancel}>
                    <Text style={[styles.cancelButtonText, { color: colors.danger }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.extendButton, { backgroundColor: colors.primary }]} onPress={handleExtend}>
                    <Text style={styles.extendButtonText}>Extend</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.completeButton, { backgroundColor: colors.success }]} onPress={handleComplete}>
                  <Text style={styles.completeButtonText}>Complete Booking</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active booking</Text>
              </View>
            )
          ) : (
            bookingHistory.map((booking) => (
              <View key={booking.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.bookingHeader}>
                  <Text style={[styles.bookingZone, { color: colors.text }]}>{booking.zone_name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: booking.status === 'completed' ? colors.success + '20' : colors.danger + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: booking.status === 'completed' ? colors.success : colors.danger }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.bookingSlot, { color: colors.text }]}>Spot {booking.slot_number}</Text>
                <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>{formatDate(booking.start_time)}</Text>
                <Text style={[styles.bookingTime, { color: colors.textSecondary }]}>
                  {formatTime(booking.start_time)} - {booking.end_time ? formatTime(booking.end_time) : 'N/A'}
                </Text>
                <Text style={[styles.bookingPrice, { color: colors.primary }]}>₹{booking.amount_paid}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 16 },
  content: { flex: 1, padding: 16 },
  activeBookingCard: { padding: 20, borderRadius: 12, borderWidth: 1 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bookingZone: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  bookingDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bookingSlot: { marginLeft: 12, fontSize: 16, fontWeight: '600' },
  bookingText: { marginLeft: 12, fontSize: 16 },
  bookingPrice: { marginLeft: 12, fontSize: 20, fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', marginTop: 16, gap: 12 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { fontWeight: 'bold' },
  extendButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  extendButtonText: { color: '#fff', fontWeight: 'bold' },
  completeButton: { marginTop: 12, padding: 14, borderRadius: 8, alignItems: 'center' },
  completeButtonText: { color: '#fff', fontWeight: 'bold' },
  historyCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  bookingDate: { marginTop: 8, fontSize: 14 },
  bookingTime: { marginTop: 4, fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
});