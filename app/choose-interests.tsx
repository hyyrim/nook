import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Radius } from '@/constants';
import { createInitialCategories } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { CategoryBottomSheet } from '@/components/CategoryBottomSheet';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

const PRESET_CATEGORIES = [
  'AI', '테크', '경제', '비즈니스', '커리어', '디자인',
  '인테리어', '여행', '음식', '음악', '영화', '운동',
];

const MIN_SELECT = 3;
const MAX_SELECT = 6;

export default function ChooseInterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const allCategories = [...PRESET_CATEGORIES, ...customCategories];
  const canProceed = selected.length >= MIN_SELECT;

  const toggle = (cat: string) => {
    setSelected(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, cat];
    });
  };

  const handleAddCustom = (data: { name: string; color: string | null; icon: string | null }) => {
    const name = data.name;
    if (allCategories.some(c => c.toLowerCase() === name.toLowerCase())) return;
    setCustomCategories(prev => [...prev, name]);
    setSelected(prev => (prev.length < MAX_SELECT ? [...prev, name] : prev));
  };

  const handleRemoveCustom = (name: string) => {
    setCustomCategories(prev => prev.filter(c => c !== name));
    setSelected(prev => prev.filter(c => c !== name));
  };

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
        <ScrollView
          style={styles.chipScroll}
          contentContainerStyle={styles.chipGrid}
          showsVerticalScrollIndicator={false}
        >
          {PRESET_CATEGORIES.map(cat => {
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

          {customCategories.map(cat => {
            const isSelected = selected.includes(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => toggle(cat)}
                style={[styles.chip, styles.customChip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cat}
                </Text>
                <Pressable
                  onPress={() => handleRemoveCustom(cat)}
                  hitSlop={8}
                  style={styles.removeButton}
                >
                  <Ionicons
                    name="close"
                    size={12}
                    color={isSelected ? Colors.surface : Colors.secondary}
                  />
                </Pressable>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setShowAddSheet(true)}
            style={styles.addChip}
          >
            <Ionicons name="add" size={14} color={Colors.secondary} />
            <Text style={styles.addChipText}>직접 추가</Text>
          </Pressable>
        </ScrollView>

        {/* Bottom */}
        <View style={styles.bottom}>
          <Text style={styles.counter}>
            {selected.length} / {MAX_SELECT}개 선택됨
          </Text>
          <PrimaryButton
            label="시작하기"
            onPress={handleGetStarted}
            disabled={!canProceed}
            loading={saving}
            style={styles.cta}
            labelStyle={styles.ctaText}
          />
        </View>
      </View>

      <CategoryBottomSheet
        visible={showAddSheet}
        mode="add"
        existingNames={allCategories}
        onClose={() => setShowAddSheet(false)}
        onSubmit={handleAddCustom}
      />
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
  chipScroll: {
    flex: 1,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 12,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
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
  removeButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
  },
  bottom: {
    paddingTop: 8,
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
    paddingVertical: 16,
  },
  ctaText: {
    fontWeight: '700',
  },
});
