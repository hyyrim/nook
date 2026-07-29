import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Colors, Radius } from '@/constants';
import { registerConfirmHandler, type ConfirmOptions } from '@/lib/confirm';

type Pending = { options: ConfirmOptions; resolve: (v: boolean) => void };

// 웹 전용 커스텀 confirm 다이얼로그. root에 한 번 마운트되어 confirmAsync(웹)의 핸들러를 등록한다.
// 네이티브는 Alert.alert를 쓰므로 렌더하지 않는다.
export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    registerConfirmHandler((options) => new Promise<boolean>((resolve) => setPending({ options, resolve })));
    return () => registerConfirmHandler(null);
  }, []);

  if (Platform.OS !== 'web' || !pending) return null;

  const { options, resolve } = pending;
  const close = (v: boolean) => {
    resolve(v);
    setPending(null);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => close(false)}>
      <Pressable style={styles.overlay} onPress={() => close(false)}>
        <View
          style={styles.card}
          // 카드 내부 클릭이 overlay(취소)로 전파되지 않게 웹 전용 차단.
          {...(Platform.OS === 'web'
            ? ({ onClick: (e: { stopPropagation: () => void }) => e.stopPropagation() } as object)
            : {})}
        >
          <Text style={styles.title}>{options.title}</Text>
          {options.message ? <Text style={styles.message}>{options.message}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              onPress={() => close(false)}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelText}>{options.cancelLabel ?? '취소'}</Text>
            </Pressable>
            <Pressable
              onPress={() => close(true)}
              style={({ pressed }) => [
                styles.button,
                options.destructive ? styles.destructiveButton : styles.confirmButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.confirmText}>{options.confirmLabel ?? '확인'}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 22,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  message: {
    fontSize: 14,
    color: Colors.secondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.md,
    minWidth: 72,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  destructiveButton: {
    backgroundColor: Colors.accent,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
