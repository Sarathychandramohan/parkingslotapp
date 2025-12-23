import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { zoneService, ParkingZone } from '~/constants/apiService';
import CreateZoneEmptyState from '~/components/CreateZoneEmptyState';
import { useThemeColors } from '~/hooks/useThemeColors';

interface Props {
  children: React.ReactNode;
}

export default function AdminCreateZoneGate({ children }: Props) {
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState<ParkingZone | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchZone = async () => {
      try {
        const z = await zoneService.getMyZone();

        if (mounted) {
          setZone(z); // z === null means NO ZONE (valid)
        }
      } catch {
        // Unauthorized or other errors → treat as no zone
        if (mounted) setZone(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchZone();

    return () => {
      mounted = false;
    };
  }, []);

  // ⏳ LOADING STATE
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 🅿️ NO ZONE → SHOW CREATE ZONE CTA
  if (!zone) {
    return <CreateZoneEmptyState />;
  }

  // ✅ ZONE EXISTS → RENDER CHILDREN
  return <>{children}</>;
}
