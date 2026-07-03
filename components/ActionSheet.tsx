import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useRef } from 'react';
import { Colors, Radius } from '@/constants';

type ActionSheetAction = {
  label: string;
  danger?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  actions: ActionSheetAction[];
  onClose: () => void;
  handoffDelay?: number;
};

export function ActionSheet({ visible, actions, onClose, handoffDelay = 0 }: ActionSheetProps) {
  const pendingActionRef = useRef<(() => void) | null>(null);

  const runPendingAction = () => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pendingAction) pendingAction();
  };

  const handleActionPress = (action: ActionSheetAction) => {
    pendingActionRef.current = action.onPress;
    onClose();
    if (handoffDelay > 0) {
      setTimeout(runPendingAction, handoffDelay);
      return;
    }
    runPendingAction();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onDismiss={runPendingAction}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
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
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.actionPressed]}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
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
  sheetContainer: {
    gap: 10,
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
