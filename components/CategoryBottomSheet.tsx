import { Animated, View, Text, TextInput, StyleSheet, Pressable, Modal, Keyboard, ScrollView, useWindowDimensions } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Reanimated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { BOTTOM_SHEET_PADDING_BOTTOM, Colors, Radius, Typography } from '@/constants';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_DEFAULT_BG,
  CATEGORY_ICON_PRESETS,
  getCategoryColor,
} from '@/constants/categoryStyle';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';
import { CategoryIcon } from './CategoryIcon';

type CategorySubmitData = {
  name: string;
  color: string | null;
  icon: string | null;
};

type CategoryBottomSheetProps = {
  visible: boolean;
  mode: 'add' | 'edit';
  initialValue?: string;
  initialColor?: string | null;
  initialIcon?: string | null;
  existingNames?: string[];
  onClose: () => void;
  onSubmit?: (data: CategorySubmitData) => void;
};

export function CategoryBottomSheet({
  visible,
  mode,
  initialValue = '',
  initialColor = null,
  initialIcon = null,
  existingNames = [],
  onClose,
  onSubmit,
}: CategoryBottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [value, setValue] = useState(initialValue);
  const [color, setColor] = useState<string | null>(initialColor);
  const [icon, setIcon] = useState<string | null>(initialIcon);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(visible);
  const inputRef = useRef<TextInput>(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  const keyboard = useAnimatedKeyboard();
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: BOTTOM_SHEET_PADDING_BOTTOM + keyboard.height.value,
  }));

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  useEffect(() => {
    setValue(initialValue);
    setColor(initialColor);
    setIcon(initialIcon);
    setError('');
  }, [initialValue, initialColor, initialIcon, visible]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 230,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 600,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false);
    });
  }, [visible, backdropOpacity, sheetTranslateY]);

  const isEdit = mode === 'edit';
  const title = isEdit ? '카테고리 수정' : '카테고리 추가';
  const cta = isEdit ? '수정' : '추가';
  const maxSheetHeight = windowHeight * 0.82;
  // 이름/색상/CTA는 고정, 아이콘 그리드만 별도 스크롤.
  // 3.5행(≈ 3.5 × 46px = 161)만 노출해 4번째 행이 절반만 잘려 보이게 하는 peek 패턴.
  // 잘린 행이 "더 있음"을 시각적으로 알린다.
  const iconScrollMaxHeight = Math.min(161, maxSheetHeight - 360);

  const handleValueChange = (text: string) => {
    setValue(text);
    if (error) setError('');
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const isDuplicate = existingNames.some(
      (name) => name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate && trimmed.toLowerCase() !== initialValue.trim().toLowerCase()) {
      setError('이미 같은 이름의 카테고리가 있어요');
      return;
    }
    onSubmit?.({ name: trimmed, color, icon });
    handleClose();
  };

  const dismissKeyboardOnPickerTap = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.dim, { opacity: backdropOpacity }]}
      />
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <Reanimated.View style={[styles.sheet, { maxHeight: maxSheetHeight }, sheetAnimatedStyle]}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="예) AI, 디자인, 여행..."
                placeholderTextColor={Colors.tertiary}
                value={value}
                onChangeText={handleValueChange}
              />
              {error ? <Text style={Typography.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>색상</Text>
              <View style={styles.swatchRow}>
                <Pressable
                  key="no-color"
                  onPress={() => {
                    dismissKeyboardOnPickerTap();
                    setColor(null);
                  }}
                  style={[
                    styles.swatch,
                    styles.swatchNoColor,
                    color === null && styles.swatchSelected,
                  ]}
                >
                  <Ionicons name="close" size={14} color={Colors.tertiary} />
                </Pressable>
                {CATEGORY_COLOR_PRESETS.map((preset) => {
                  const selected = color === preset.key;
                  return (
                    <Pressable
                      key={preset.key}
                      onPress={() => {
                        dismissKeyboardOnPickerTap();
                        setColor(preset.key);
                      }}
                      style={[
                        styles.swatch,
                        { backgroundColor: preset.bg },
                        selected && styles.swatchSelected,
                      ]}
                    >
                      {selected && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.iconField}>
              <Text style={styles.label}>아이콘</Text>
              <ScrollView
                style={[styles.iconScroll, { maxHeight: iconScrollMaxHeight }]}
                contentContainerStyle={styles.iconGrid}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  key="no-icon"
                  onPress={() => {
                    dismissKeyboardOnPickerTap();
                    setIcon(null);
                  }}
                  style={[
                    styles.iconTile,
                    icon === null && styles.iconTileSelected,
                  ]}
                >
                  <Ionicons name="close" size={15} color={Colors.tertiary} />
                </Pressable>
                {CATEGORY_ICON_PRESETS.map((iconName) => {
                  const selected = icon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => {
                        dismissKeyboardOnPickerTap();
                        setIcon(iconName);
                      }}
                      style={[
                        styles.iconTile,
                        selected && styles.iconTileSelected,
                      ]}
                    >
                      <CategoryIcon name={iconName} size={17} color={Colors.secondary} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <PrimaryButton
              label={cta}
              onPress={handleSubmit}
              disabled={!value.trim()}
              style={styles.ctaButton}
            />
          </Reanimated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const SWATCH_SIZE = 30;
const ICON_TILE_SIZE = 38;

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#DCDCDC',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    marginBottom: 18,
  },
  iconField: {
    marginBottom: 8,
  },
  iconScroll: {
    flexGrow: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    height: 44,
    paddingHorizontal: 13,
    paddingVertical: 0,
    fontSize: 14,
    color: Colors.primary,
    textAlignVertical: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchNoColor: {
    backgroundColor: CATEGORY_DEFAULT_BG,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconTile: {
    width: ICON_TILE_SIZE,
    height: ICON_TILE_SIZE,
    borderRadius: 11,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileSelected: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  ctaButton: {
    marginTop: 10,
  },
});
