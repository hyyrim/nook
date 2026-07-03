import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'large' | 'small';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  size = 'large',
  fullWidth,
  style,
  labelStyle,
  testID,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const shouldFillWidth = fullWidth ?? size === 'large';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : styles.small,
        shouldFillWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text
          style={[
            styles.labelBase,
            size === 'large' ? styles.labelLarge : styles.labelSmall,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  small: {
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fullWidth: {
    width: '100%',
  },
  // 비활성 시 통일된 회색. Colors 토큰에는 담지 않고 컴포넌트 내부에만 유지.
  disabled: {
    backgroundColor: '#C8C8C8',
  },
  pressed: {
    opacity: 0.7,
  },
  labelBase: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 15,
  },
  labelSmall: {
    fontSize: 14,
  },
});
