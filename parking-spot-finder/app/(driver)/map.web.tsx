import { View, Text, StyleSheet } from 'react-native';

export default function MapWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Map is available only on mobile devices.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    opacity: 0.6,
  },
});
