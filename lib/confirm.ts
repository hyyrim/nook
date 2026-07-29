import { Alert, Platform } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

// 웹 커스텀 다이얼로그 핸들러. ConfirmHost가 마운트되며 등록한다. 없으면 window.confirm 폴백.
type ConfirmHandler = (opts: ConfirmOptions) => Promise<boolean>;
let webHandler: ConfirmHandler | null = null;
export function registerConfirmHandler(handler: ConfirmHandler | null) {
  webHandler = handler;
}

// 확인/취소 다이얼로그. 네이티브는 Alert.alert, 웹은 커스텀 다이얼로그(ConfirmHost).
// react-native-web에는 Alert.alert 버튼 UI가 없어 웹에선 confirm이 안 뜬다.
export function confirmAsync(
  title: string,
  message?: string,
  opts?: Omit<ConfirmOptions, 'title' | 'message'>,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (webHandler) return webHandler({ title, message, ...opts });
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: opts?.cancelLabel ?? '취소', style: 'cancel', onPress: () => resolve(false) },
      {
        text: opts?.confirmLabel ?? '확인',
        style: opts?.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
