import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

      <TextInput
        {...props}
        style={[
          styles.input,
          { color: colors.text },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
      />

      {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    marginHorizontal: 6,
  },
});
