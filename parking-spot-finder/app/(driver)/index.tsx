import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { zoneService, bookingService, ParkingZone } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<ParkingZone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'car' | 'bike' | 'truck'>('all');
  
  // Booking modal
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingHours, setBookingHours] = useState('2');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Stats
  const [nearbyCount, setNearbyCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    filterZones();
  }, [searchQuery, zones, activeFilter]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await zoneService.getAllZones();
      setZones(data);
      
      setNearbyCount(data.length);
      const available = data.reduce((sum, zone) => sum + zone.available_slots, 0);
      setAvailableCount(available);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterZones = () => {
    let filtered = zones;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(zone =>
        zone.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Vehicle type filter (you can extend this based on slot data)
    // For now, show all zones regardless of filter
    
    setFilteredZones(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchZones();
    setRefreshing(false);
  };

  const handleZonePress = (zone: ParkingZone) => {
    if (zone.available_slots === 0) {
      Alert.alert('Full', 'This parking zone is currently full');
      return;
    }
    setSelectedZone(zone);
    setShowBookingModal(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedZone) return;

    const hours = parseInt(bookingHours);
    if (isNaN(hours) || hours < 1 || hours > 12) {
      Alert.alert('Invalid Hours', 'Please enter hours between 1 and 12');
      return;
    }

    try {
      setBookingLoading(true);
      await bookingService.createBooking({
        zone_id: selectedZone.id,
        duration_hours: hours,
      });

      setShowBookingModal(false);
      setSelectedZone(null);
      setBookingHours('2');

      Alert.alert(
        'Booking Successful! 🎉',
        `Your parking spot at ${selectedZone.name} is reserved for ${hours} hour(s)`,
        [
          {
            text: 'View Booking',
            onPress: () => {
              // Navigate to bookings tab - you'll need to implement tab navigation
            },
          },
          { text: 'OK' },
        ]
      );

      fetchZones(); // Refresh to update availability
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Driver'}</Text>
        </View>
        <TouchableOpacity style={[styles.themeButton, { backgroundColor: colors.border }]}>
          <Ionicons name="moon" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search parking zones..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="location" size={32} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{nearbyCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Nearby</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{availableCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Available</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'all' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Ionicons name="grid" size={18} color={activeFilter === 'all' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.filterChipText, { color: activeFilter === 'all' ? '#fff' : colors.textSecondary }]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'car' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setActiveFilter('car')}
          >
            <Ionicons name="car" size={18} color={activeFilter === 'car' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.filterChipText, { color: activeFilter === 'car' ? '#fff' : colors.textSecondary }]}>
              Car
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'bike' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setActiveFilter('bike')}
          >
            <Ionicons name="bicycle" size={18} color={activeFilter === 'bike' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.filterChipText, { color: activeFilter === 'bike' ? '#fff' : colors.textSecondary }]}>
              Bike
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'truck' && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setActiveFilter('truck')}
          >
            <Ionicons name="bus" size={18} color={activeFilter === 'truck' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.filterChipText, { color: activeFilter === 'truck' ? '#fff' : colors.textSecondary }]}>
              Truck
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Parking Zones</Text>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {filteredZones.length} results
          </Text>
        </View>

        {/* Parking Zones List */}
        {filteredZones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No parking zones found</Text>
          </View>
        ) : (
          filteredZones.map((zone) => (
            <TouchableOpacity
              key={zone.id}
              style={[styles.zoneCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleZonePress(zone)}
            >
              <View style={styles.zoneHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneName, { color: colors.text }]}>{zone.name}</Text>
                  <View style={styles.zoneInfo}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.zoneDistance, { color: colors.textSecondary }]}>0.5 km</Text>
                    <Ionicons name="star" size={14} color={colors.warning} style={{ marginLeft: 12 }} />
                    <Text style={[styles.zoneRating, { color: colors.textSecondary }]}>4.5</Text>
                  </View>
                </View>
                <View style={[styles.priceTag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.priceText, { color: colors.primary }]}>₹20/hr</Text>
                </View>
              </View>

              <View style={styles.zoneFooter}>
                <View style={styles.availabilityContainer}>
                  <Text
                    style={[
                      styles.availabilityText,
                      { color: zone.available_slots > 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {zone.available_slots > 0 ? `${zone.available_slots} spots available` : 'Full'}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(zone.available_slots / zone.total_slots) * 100}%`,
                          backgroundColor: zone.available_slots > 0 ? colors.success : colors.danger,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.totalSlots, { color: colors.textSecondary }]}>
                    {zone.available_slots}/{zone.total_slots}
                  </Text>
                </View>

                {zone.available_slots > 0 && (
                  <TouchableOpacity
                    style={[styles.bookButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleZonePress(zone)}
                  >
                    <Text style={styles.bookButtonText}>Book</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={showBookingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Book Parking</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.zonePreview, { backgroundColor: colors.background }]}>
              <Ionicons name="business" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.previewZoneName, { color: colors.text }]}>{selectedZone?.name}</Text>
                <Text style={[styles.previewAvailability, { color: colors.success }]}>
                  {selectedZone?.available_slots} slots available
                </Text>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Duration (hours)</Text>
            <View style={styles.durationPicker}>
              {['1', '2', '3', '4', '6', '12'].map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.durationButton,
                    bookingHours === hour && { backgroundColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setBookingHours(hour)}
                >
                  <Text style={[styles.durationText, { color: bookingHours === hour ? '#fff' : colors.text }]}>
                    {hour}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.priceBreakdown, { backgroundColor: colors.background }]}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Rate</Text>
                <Text style={[styles.priceValue, { color: colors.text }]}>₹20/hour</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.priceValue, { color: colors.text }]}>{bookingHours} hour(s)</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  ₹{20 * parseInt(bookingHours)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
  welcomeText: { fontSize: 14 },
  userName: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  themeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 8 },
  statNumber: { fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14, marginTop: 4 },
  filterContainer: { paddingHorizontal: 16, marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  filterChipText: { marginLeft: 6, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  resultCount: { fontSize: 14 },
  zoneCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  zoneHeader: { flexDirection: 'row', marginBottom: 12 },
  zoneName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  zoneInfo: { flexDirection: 'row', alignItems: 'center' },
  zoneDistance: { marginLeft: 4, fontSize: 13 },
  zoneRating: { marginLeft: 4, fontSize: 13 },
  priceTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceText: { fontWeight: 'bold' },
  zoneFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  availabilityContainer: { flex: 1 },
  availabilityText: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%' },
  totalSlots: { fontSize: 12 },
  bookButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  bookButtonText: { color: '#fff', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  zonePreview: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16 },
  previewZoneName: { fontSize: 16, fontWeight: '600' },
  previewAvailability: { fontSize: 13, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  durationPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  durationButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  durationText: { fontSize: 14, fontWeight: '600' },
  priceBreakdown: { padding: 16, borderRadius: 12, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  confirmButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});