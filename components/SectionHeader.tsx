import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type SectionHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  dot?: boolean;
  subtitle?: string;
  rightAction?: { label: string; onPress: () => void };
};

export function SectionHeader({ icon, label, dot, subtitle, rightAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.row}>
          <Ionicons name={icon} size={15} color={Colors.primary} />
          <Text style={styles.label}>{label}</Text>
          {dot && <View style={styles.dot} />}
        </View>
        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Text style={styles.actionLabel}>{rightAction.label}</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.secondary} />
          </Pressable>
        )}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 13,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginLeft: 0,
    marginTop: 1,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.secondary,
  },
});
