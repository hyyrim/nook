import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';

type InterestInsightCardProps = {
  categoryName: string;
  previous: number;
  recent: number;
  onPress?: () => void;
};

export function InterestInsightCard({ categoryName, previous, recent, onPress }: InterestInsightCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="trending-up" size={18} color={Colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          최근 2주 <Text style={styles.titleAccent}>{categoryName}</Text> 저장이 평소보다 늘었어요
        </Text>
        <Text style={styles.subtitle}>
          이전 2주 {previous}개 → 이번 2주 {recent}개
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.primary,
    lineHeight: 19,
  },
  titleAccent: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 17,
  },
});
