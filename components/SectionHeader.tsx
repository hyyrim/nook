import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type SectionHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  dot?: boolean;
  subtitle?: string;
};

export function SectionHeader({ icon, label, dot, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={styles.label}>{label}</Text>
        {dot && <View style={styles.dot} />}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 16,
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
});
