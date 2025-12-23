import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColors } from '~/hooks/useThemeColors';

export default function CreateZoneEmptyState() {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <Ionicons
        name="business-outline"
        size={72}
        color={colors.textSecondary}
      />
      <Text
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          marginTop: 16,
          color: colors.text,
        }}
      >
        No parking zone yet
      </Text>
      <Text
        style={{
          textAlign: 'center',
          marginTop: 8,
          color: colors.textSecondary,
        }}
      >
        Create your first parking zone to start managing slots and bookings
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(admin)/zones')}
        style={{
          marginTop: 20,
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>
          Create Parking Zone
        </Text>
      </TouchableOpacity>
    </View>
  );
}
