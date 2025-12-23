import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';

const PARKING_ZONES = [
  {
    id: '1',
    name: 'Downtown Mall',
    latitude: 13.0827,
    longitude: 80.2707,
    available: 12,
  },
  {
    id: '2',
    name: 'Tech Park',
    latitude: 13.0674,
    longitude: 80.2376,
    available: 0,
  },
  {
    id: '3',
    name: 'Airport Terminal',
    latitude: 12.9941,
    longitude: 80.1709,
    available: 45,
  },
];

export default function MapScreen() {
  const { colors } = useTheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Loading map…
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location?.coords.latitude || 13.0827,
          longitude: location?.coords.longitude || 80.2707,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {PARKING_ZONES.map((zone) => (
          <Marker
            key={zone.id}
            coordinate={{
              latitude: zone.latitude,
              longitude: zone.longitude,
            }}
            title={zone.name}
            description={`${zone.available} spots available`}
            pinColor={zone.available === 0 ? 'red' : 'green'}
          />
        ))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
