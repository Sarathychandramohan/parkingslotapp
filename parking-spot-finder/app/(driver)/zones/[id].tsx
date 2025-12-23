import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { slotService } from '~/constants/apiService';
import { useThemeColors } from '~/hooks/useThemeColors';

export default function DriverZoneSlots() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      console.log('Loading slots for zone:', id);
      const slotList = await slotService.getZoneSlots(Number(id));
      console.log('Slots:', slotList);
      setSlots(slotList);
    } catch (e) {
      console.error('Slot load error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Available Slots
      </Text>

      {/* 🔲 EXACT SAME GRID AS ADMIN */}
      <View style={styles.grid}>
        {slots.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            No slots found
          </Text>
        ) : (
          slots.map(slot => {
            const isAvailable = slot.status === 'available';

            return (
              <View
                key={slot.id}
                style={[
                  styles.slotCard,
                  {
                    backgroundColor: isAvailable
                      ? colors.success + '15'
                      : colors.danger + '15',
                    borderColor: isAvailable
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                <Ionicons
                  name={
                    slot.vehicle_type === 'car'
                      ? 'car-outline'
                      : slot.vehicle_type === 'bike'
                      ? 'bicycle-outline'
                      : 'bus-outline'
                  }
                  size={24}
                  color={isAvailable ? colors.success : colors.danger}
                />

                <Text style={[styles.slotName, { color: colors.text }]}>
                  {slot.slot_number}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: isAvailable
                      ? colors.success
                      : colors.danger,
                  }}
                >
                  {slot.status.toUpperCase()}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

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
  slotName: {
    marginTop: 6,
    fontWeight: '600',
  },
});
