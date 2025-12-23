// components/parking/SpotGrid.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export type SpotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface ParkingSpot {
  id: string;
  number: string;
  status: SpotStatus;
  vehicleType: 'car' | 'bike' | 'truck';
  selected?: boolean;
}

interface SpotGridProps {
  spots: ParkingSpot[];
  onSpotPress?: (spot: ParkingSpot) => void;
  columns?: number;
  animated?: boolean;
  selectable?: boolean;
}

export const SpotGrid: React.FC<SpotGridProps> = ({
  spots,
  onSpotPress,
  columns = 4,
  animated = true,
  selectable = false,
}) => {
  const { colors } = useTheme();

  const getStatusColor = (status: SpotStatus) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'occupied':
        return colors.danger;
      case 'reserved':
        return colors.warning;
      case 'maintenance':
        return colors.textSecondary;
      default:
        return colors.border;
    }
  };

  const SpotItem = ({ spot }: { spot: ParkingSpot }) => {
    const scale = useSharedValue(1);

    React.useEffect(() => {
      if (animated && spot.status === 'available') {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          false
        );
      }
    }, [spot.status, animated]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const spotColor = getStatusColor(spot.status);

    return (
      <TouchableOpacity
        onPress={() => onSpotPress?.(spot)}
        style={[styles.spotWrapper, { width: (width - 60) / columns }]}
        disabled={!onSpotPress}
      >
        <Animated.View
          style={[
            styles.spot,
            {
              backgroundColor: spotColor + '30',
              borderColor: spotColor,
              borderWidth: spot.selected ? 3 : 2,
            },
            animated && spot.status === 'available' && animatedStyle,
          ]}
        >
          {selectable && spot.selected && (
            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          )}
          <Ionicons
            name={
              spot.vehicleType === 'car'
                ? 'car-sport'
                : spot.vehicleType === 'bike'
                ? 'bicycle'
                : 'bus'
            }
            size={20}
            color={spotColor}
          />
          <Text style={[styles.spotNumber, { color: spotColor }]}>
            {spot.number}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: spotColor }]} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.grid}>
      {spots.map((spot) => (
        <SpotItem key={spot.id} spot={spot} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  spotWrapper: {
    aspectRatio: 1,
  },
  spot: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotNumber: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
});