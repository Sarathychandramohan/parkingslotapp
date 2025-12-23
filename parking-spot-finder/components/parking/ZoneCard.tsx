// components/parking/ZoneCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import  Card  from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';

export interface ParkingZone {
  id: string;
  name: string;
  distance: string;
  availableSpots: number;
  totalSpots: number;
  price: string;
  rating: number;
  vehicleTypes: ('car' | 'bike' | 'truck')[];
}

interface ZoneCardProps {
  zone: ParkingZone;
  onPress?: () => void;
}

export const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onPress }) => {
  const { colors } = useTheme();

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return colors.danger;
    if (percentage < 30) return colors.warning;
    return colors.success;
  };

  const availabilityColor = getAvailabilityColor(zone.availableSpots, zone.totalSpots);

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>{zone.name}</Text>
            <View style={styles.details}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.distance, { color: colors.textSecondary }]}>
                {zone.distance}
              </Text>
              <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={[styles.rating, { color: colors.textSecondary }]}>
                {zone.rating}
              </Text>
            </View>
          </View>
          <View style={[styles.priceTag, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.price, { color: colors.primary }]}>{zone.price}</Text>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.availability}>
          <View style={styles.availabilityInfo}>
            <Text style={[styles.availabilityText, { color: availabilityColor }]}>
              {zone.availableSpots === 0
                ? 'Full'
                : `${zone.availableSpots} spots available`}
            </Text>
            <Text style={[styles.totalSpots, { color: colors.textSecondary }]}>
              {zone.availableSpots}/{zone.totalSpots}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(zone.availableSpots / zone.totalSpots) * 100}%`,
                  backgroundColor: availabilityColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Vehicle Types */}
        <View style={styles.vehicleTypes}>
          {zone.vehicleTypes.map((type) => (
            <View key={type} style={[styles.vehicleIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name={type === 'car' ? 'car-sport' : type === 'bike' ? 'bicycle' : 'bus'}
                size={16}
                color={colors.textSecondary}
              />
            </View>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  rating: {
    fontSize: 12,
  },
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
  },
  availability: {
    marginBottom: 12,
  },
  availabilityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalSpots: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  vehicleTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});