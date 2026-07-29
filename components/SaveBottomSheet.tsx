import { Animated, Easing, View, Text, TextInput, StyleSheet, Pressable, Modal, Keyboard, Platform } from 'react-native';
import { useRef, useState, useEffect, useCallback } from 'react';
import Reanimated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { BOTTOM_SHEET_PADDING_BOTTOM, Colors, Radius, Typography } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { isDuplicateContentUrlError, saveContent } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { emit } from '@/lib/events';
import { useToast } from '@/lib/toast';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useIsDesktopWeb } from '@/lib/useIsDesktopWeb';

type SaveBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function SaveBottomSheet({ visible, onClose, onSaved }: SaveBottomSheetProps) {
  const isDesktop = useIsDesktopWeb();
  const [url, setUrl] = useState('');
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // 모바일: 하단 슬라이드업(translateY). 데스크탑 모달: 제자리 fade + subtle scale(표준 #5).
  const sheetTranslateY = useRef(new Animated.Value(isDesktop ? 0 : 360)).current;
  const sheetScale = useRef(new Animated.Value(isDesktop ? 0.96 : 1)).current;
  const sheetOpacity = useRef(new Animated.Value(isDesktop ? 0 : 1)).current;
  const toast = useToast();

  const keyboard = useAnimatedKeyboard();
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: BOTTOM_SHEET_PADDING_BOTTOM + keyboard.height.value,
  }));

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      setUrl('');
      setUrlError('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        ...(isDesktop
          ? [
              Animated.timing(sheetOpacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.spring(sheetScale, { toValue: 1, damping: 22, stiffness: 230, mass: 0.9, useNativeDriver: true }),
            ]
          : [
              Animated.spring(sheetTranslateY, { toValue: 0, damping: 22, stiffness: 230, mass: 0.9, useNativeDriver: true }),
            ]),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ...(isDesktop
        ? [
            // 중앙 모달: 제자리 fade + 살짝 축소로 사라짐(아래로 슬라이드 X). ease-out, 140ms.
            Animated.timing(sheetOpacity, { toValue: 0, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(sheetScale, { toValue: 0.97, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]
        : [
            Animated.timing(sheetTranslateY, { toValue: 360, duration: 190, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          ]),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false);
    });
  }, [visible, backdropOpacity, sheetTranslateY, sheetScale, sheetOpacity, isDesktop]);

  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');

  const isValidUrl = (text: string) => {
    try {
      const parsed = new URL(text);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (text: string) => {
    setUrl(text);
    if (urlError) setUrlError('');
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setUrlError('올바른 URL을 입력해 주세요');
      void analytics.saveAttempted('direct');
      void analytics.saveFailed('invalid_url', 'direct');
      return;
    }
    setSaving(true);
    try {
      const domain = new URL(trimmed).hostname;
      await saveContent({ url: trimmed, domain }, { entry_source: 'direct' });
      onSaved?.();
      emit('content-saved');
      Keyboard.dismiss();
      onClose();
      toast.show('저장 완료!', 'success');
    } catch (e: unknown) {
      Keyboard.dismiss();
      onClose();
      const msg = isDuplicateContentUrlError(e)
        ? '이미 저장된 링크예요'
        : '저장에 실패했어요';
      toast.show(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View
        pointerEvents="none"
        style={[styles.dim, { opacity: backdropOpacity }]}
      />
      <Pressable style={[styles.backdrop, isDesktop && styles.backdropCentered]} onPress={handleClose}>
        <Animated.View
          style={[
            styles.sheetContainer,
            isDesktop && styles.sheetContainerCentered,
            isDesktop
              ? { opacity: sheetOpacity, transform: [{ scale: sheetScale }] }
              : { transform: [{ translateY: sheetTranslateY }] },
          ]}
          onStartShouldSetResponder={() => true}
          // 웹: backdrop Pressable가 콘텐츠를 감싸 input 클릭이 닫기로 전파됨(onStartShouldSetResponder는
          // native 전용). 시트 내부 클릭은 여기서 전파 차단. 네이티브는 빈 스프레드라 무영향.
          {...(Platform.OS === 'web'
            ? ({ onClick: (e: { stopPropagation: () => void }) => e.stopPropagation() } as object)
            : {})}
        >
          <Reanimated.View style={[styles.sheet, sheetAnimatedStyle, isDesktop && styles.sheetCentered]}>
            {!isDesktop && <View style={styles.dragHandle} />}

            <View style={styles.header}>
              <Text style={styles.title}>링크 저장</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={14} color={Colors.secondary} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View>
                <Text style={styles.label}>URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/article"
                  placeholderTextColor={Colors.tertiary}
                  value={url}
                  onChangeText={handleUrlChange}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {urlError ? <Text style={Typography.errorText}>{urlError}</Text> : null}
              </View>

              <Pressable
                style={({ pressed }) => [styles.pasteButton, pressed && { opacity: 0.7 }]}
                onPress={handlePaste}
              >
                <Ionicons name="clipboard-outline" size={14} color={Colors.secondary} />
                <Text style={styles.pasteText}>클립보드에서 붙여넣기</Text>
              </Pressable>

              <PrimaryButton
                label="저장"
                onPress={handleSave}
                disabled={!url.trim()}
                loading={saving}
              />
            </View>
          </Reanimated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

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
  // 데스크탑: 하단 정렬 → 중앙 정렬 모달
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheetContainer: {
    width: '100%',
  },
  sheetContainerCentered: {
    maxWidth: 440,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: BOTTOM_SHEET_PADDING_BOTTOM,
    paddingTop: 12,
  },
  // 데스크탑 모달: 전체 라운드 + 상하 패딩 균형(safe-area 패딩 불필요)
  sheetCentered: {
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 22,
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
    marginBottom: 22,
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
  form: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 7,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.primary,
  },
  pasteButton: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  pasteText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary,
  },
});
