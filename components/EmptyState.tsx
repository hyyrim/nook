import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';

type EmptyStateProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  variant?: 'default' | 'center';
};

export function EmptyState({ icon, title, subtitle, variant = 'default' }: EmptyStateProps) {
  return (
    <View style={[styles.container, variant === 'center' && styles.center]}>
      <Ionicons name={icon} size={36} color={Colors.tertiary} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 96,
    gap: 4,
  },
  center: {
    paddingVertical: 0,
    transform: [{ translateY: -48 }],
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.tertiary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.tertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
