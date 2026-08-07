import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useRef } from 'react';
import { Colors, Radius } from '@/constants';
import { useIsDesktopWeb } from '@/lib/useIsDesktopWeb';

type ActionSheetAction = {
  label: string;
  danger?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  actions: ActionSheetAction[];
  onClose: () => void;
};

export function ActionSheet({ visible, actions, onClose }: ActionSheetProps) {
  const isDesktop = useIsDesktopWeb();
  const pendingActionRef = useRef<(() => void) | null>(null);

  const runPendingAction = () => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pendingAction) pendingAction();
  };

  const handleActionPress = (action: ActionSheetAction) => {
    // 웹은 Modal onDismiss가 발화하지 않아 pending 방식으로는 액션이 영영 실행되지 않는다.
    // 웹은 모달 스택 race도 없으므로 닫고 바로 실행한다.
    if (isDesktop) {
      onClose();
      action.onPress();
      return;
    }
    // iOS: 액션 실행은 onClose로 시트를 닫은 뒤 onDismiss(모달이 완전히 사라진 뒤 iOS가
    // 발화)에서만 한다. 즉시 실행하거나 setTimeout으로 미리 실행하면 dismiss가 아직
    // 끝나지 않은 사이에 다음 시트를 present → 두 모달 전환이 겹쳐 orphan container가
    // 터치를 캡처하는 먹통을 유발한다. onDismiss는 dismiss 완료를 보장하는 신호라 race가 없다.
    pendingActionRef.current = action.onPress;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onDismiss={runPendingAction}
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, isDesktop && styles.backdropCentered]} onPress={onClose}>
        <View style={[styles.sheetContainer, isDesktop && styles.sheetContainerCentered]}>
          <View style={styles.actionsCard}>
            {actions.map((action, i) => (
              <Pressable
                key={action.label}
                onPress={() => handleActionPress(action)}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionPressed,
                  i < actions.length - 1 && styles.actionBorder,
                ]}
              >
                <Text style={[styles.actionText, action.danger && styles.dangerText]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* 웹은 배경 클릭으로 닫으므로 별도 취소 버튼 없이 중앙 카드만 노출 */}
          {!isDesktop && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
    padding: 12,
    paddingBottom: 20,
  },
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheetContainer: {
    gap: 10,
  },
  sheetContainerCentered: {
    width: '100%',
    maxWidth: 320,
  },
  actionsCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionPressed: {
    backgroundColor: Colors.pressOverlay,
  },
  actionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  actionText: {
    fontSize: 16,
    color: Colors.primary,
  },
  dangerText: {
    fontWeight: '500',
    color: Colors.accent,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
