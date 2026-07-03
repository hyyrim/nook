import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { PrimaryButton } from './PrimaryButton';

type ErrorStateProps = {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = '불러오지 못했어요',
  subtitle = '네트워크 상태를 확인해 주세요',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={36} color={Colors.tertiary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {onRetry && (
        <PrimaryButton
          label="다시 시도"
          onPress={onRetry}
          size="small"
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.tertiary,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 4,
  },
});
