import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants';
import { createInitialCategories } from '@/lib/api';
import { analytics } from '@/lib/analytics';

const CATEGORIES = [
  'AI', '테크', '경제', '비즈니스', '커리어', '디자인',
  '인테리어', '여행', '음식', '음악', '영화', '운동',
];

const MIN_SELECT = 3;
const MAX_SELECT = 6;

export default function ChooseInterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (cat: string) => {
    setSelected(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, cat];
    });
  };

  const [saving, setSaving] = useState(false);
  const canProceed = selected.length >= MIN_SELECT;

  const handleGetStarted = async () => {
    setSaving(true);
    try {
      await createInitialCategories(selected);
      void analytics.onboardingCompleted();
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>관심사를 선택하세요</Text>
          <Text style={styles.subtitle}>
            {MIN_SELECT}~{MAX_SELECT}개의 카테고리를 골라주세요
          </Text>
        </View>

        {/* Chips */}
        <View style={styles.chipGrid}>
          {CATEGORIES.map(cat => {
            const isSelected = selected.includes(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => toggle(cat)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom */}
        <View style={styles.bottom}>
          <Text style={styles.counter}>
            {selected.length} / {MAX_SELECT}개 선택됨
          </Text>
          <Pressable
            onPress={handleGetStarted}
            disabled={!canProceed}
            style={({ pressed }) => [
              styles.cta,
              !canProceed && styles.ctaDisabled,
              pressed && canProceed && styles.ctaPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <Text style={[styles.ctaText, !canProceed && styles.ctaTextDisabled]}>
                시작하기
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary,
    lineHeight: 20,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  chipTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  bottom: {
    marginTop: 'auto',
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  counter: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.secondary,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  ctaDisabled: {
    backgroundColor: Colors.border,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
  ctaTextDisabled: {
    color: Colors.tertiary,
  },
});
