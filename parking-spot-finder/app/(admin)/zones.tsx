import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { zoneService, slotService } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';

type Slot = {
  id: number;
  slot_number: string;
  vehicle_type: 'car' | 'bike' | 'truck';
  status: 'available' | 'occupied';
  price_per_hour: number;
};

export default function AdminZonesScreen() {
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [slotNumber, setSlotNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike' | 'truck'>('car');
  const [price, setPrice] = useState('');

  // ✅ MOVED HERE (FIX)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchZoneAndSlots();
  }, []);

  const fetchZoneAndSlots = async () => {
    try {
      setLoading(true);

      const z = await zoneService.getMyZone();
      if (!z) {
        setZone(null);
        setSlots([]);
        return;
      }

      setZone(z);

      const slotList = await slotService.getZoneSlots(z.id);
      setSlots(slotList || []);
    } catch (err) {
      console.error('Zone fetch error:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const createSlot = async () => {
    if (!slotNumber || !price) return;

    try {
      await slotService.createSlot(zone.id, {
        slot_number: slotNumber,
        vehicle_type: vehicleType,
        price_per_hour: Number(price),
      });

      setShowCreateSlot(false);
      setSlotNumber('');
      setPrice('');
      setVehicleType('car');

      fetchZoneAndSlots();
    } catch (e) {
      console.error('Create slot error:', e);
    }
  };

  // ✅ UPDATE SLOT STATUS
  const updateSlotStatus = async () => {
    if (!selectedSlot || !zone) return;

    const newStatus =
      selectedSlot.status === 'available' ? 'occupied' : 'available';

    try {
      await slotService.updateSlotStatus(
        zone.id,
        selectedSlot.id,
        newStatus
      );

      setShowUpdateModal(false);
      setSelectedSlot(null);

      fetchZoneAndSlots();
    } catch (e) {
      console.error('Update slot error:', e);
    }
  };

  const renderVehicleIcon = (type: string) => {
    if (type === 'car') return 'car-outline';
    if (type === 'bike') return 'bicycle-outline';
    return 'bus-outline';
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!zone) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>
          No parking zone created yet
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={[styles.zoneTitle, { color: colors.text }]}>
          {zone.name}
        </Text>

        <TouchableOpacity
          style={[styles.addSlotBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateSlot(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addSlotText}>Add Slot</Text>
        </TouchableOpacity>

        {/* SLOT GRID */}
        <View style={styles.grid}>
          {slots.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginTop: 20 }}>
              No slots created yet
            </Text>
          ) : (
            slots.map(slot => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotCard,
                  {
                    backgroundColor:
                      slot.status === 'available'
                        ? colors.success + '15'
                        : colors.danger + '15',
                    borderColor:
                      slot.status === 'available'
                        ? colors.success
                        : colors.danger,
                  },
                ]}
                onPress={() => {
                  setSelectedSlot(slot);
                  setShowUpdateModal(true);
                }}
              >
                <Ionicons
                  name={renderVehicleIcon(slot.vehicle_type)}
                  size={26}
                  color={
                    slot.status === 'available'
                      ? colors.success
                      : colors.danger
                  }
                />

                <Text style={[styles.slotName, { color: colors.text }]}>
                  {slot.slot_number}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color:
                      slot.status === 'available'
                        ? colors.success
                        : colors.danger,
                  }}
                >
                  {slot.status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* CREATE SLOT MODAL (UNCHANGED) */}
      <Modal visible={showCreateSlot} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Slot
            </Text>

            <TextInput
              placeholder="Slot Number (A1, B2...)"
              value={slotNumber}
              onChangeText={setSlotNumber}
              style={[styles.input, { color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.vehicleRow}>
              {(['car', 'bike', 'truck'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setVehicleType(type)}
                  style={[
                    styles.vehicleBtn,
                    vehicleType === type && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        vehicleType === type ? '#fff' : colors.text,
                    }}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Price per hour"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              style={[styles.input, { color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={createSlot}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Create Slot
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCreateSlot(false)}>
              <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPDATE SLOT MODAL (NEW) */}
      <Modal visible={showUpdateModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Update Slot
            </Text>

            {selectedSlot && (
              <>
                <Text style={{ color: colors.text }}>
                  Slot: {selectedSlot.slot_number}
                </Text>

                <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
                  Vehicle: {selectedSlot.vehicle_type.toUpperCase()}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    {
                      backgroundColor:
                        selectedSlot.status === 'available'
                          ? colors.danger
                          : colors.success,
                    },
                  ]}
                  onPress={updateSlotStatus}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Mark as{' '}
                    {selectedSlot.status === 'available'
                      ? 'Occupied'
                      : 'Available'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowUpdateModal(false);
                setSelectedSlot(null);
              }}
            >
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  zoneTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  addSlotBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  addSlotText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotCard: {
    width: '31%',
    paddingVertical: 14,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotName: { marginTop: 6, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: { width: '85%', padding: 20, borderRadius: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vehicleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  createBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
});
