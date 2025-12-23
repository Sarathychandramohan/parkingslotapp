import React from 'react';
import { Platform } from 'react-native';

export default function MapRoute() {
  if (Platform.OS === 'web') {
    const Web = require('./map.web').default;
    return <Web />;
  } else {
    const Native = require('./map.native').default;
    return <Native />;
  }
}
