import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';

type Props = {
  label?: string;
  onPress: () => void;
};

export function HorizontalMoreCard({ label = '더보기', onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // 옆의 RediscoverCard(썸네일 104 + 텍스트 영역) 높이에 맞춰 하드코딩.
    // RediscoverCard 구조 바뀌면 함께 갱신 필요.
    width: 56,
    height: 183,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.secondary,
    letterSpacing: -0.2,
  },
});
