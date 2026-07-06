import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { isDuplicateContentUrlError, saveContent } from './api';
import { emit } from './events';
import { useToast } from './toast';

// 앱이 foreground로 진입할 때 클립보드에 URL이 있는지 non-intrusive 검사(`hasUrlAsync`)
// → 있으면 URL을 읽어 저장 프롬프트로 노출. 세션 스코프의 dismissed set으로 중복 프롬프트 방지.
//
// getUrlAsync 호출은 iOS 16+ 클립보드 접근 배너를 노출하므로 hasUrl로 우선 필터.
// enabled=false면 리스너 자체를 안 붙임 (로그인 전, 온보딩 중, share intent 처리 중 등).

const DEBOUNCE_MS = 400;

export function useClipboardSavePrompt(enabled: boolean) {
  const [promptUrl, setPromptUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  const checkClipboard = useCallback(async () => {
    try {
      const has = await Clipboard.hasUrlAsync();
      if (!has) return;
      const url = await Clipboard.getUrlAsync();
      if (!url) return;
      const normalized = url.trim();
      if (!/^https?:\/\//i.test(normalized)) return;
      if (dismissedRef.current.has(normalized)) return;
      setPromptUrl(normalized);
    } catch (e) {
      console.warn('[clipboard] hasUrlAsync failed', e);
    }
  }, []);

  const scheduleCheck = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void checkClipboard();
    }, DEBOUNCE_MS);
  }, [checkClipboard]);

  useEffect(() => {
    if (!enabled) return;

    // 최초 mount 후 한 번 검사 (앱 cold start도 커버).
    scheduleCheck();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') scheduleCheck();
    });

    return () => {
      subscription.remove();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [enabled, scheduleCheck]);

  const dismiss = useCallback(() => {
    if (promptUrl) dismissedRef.current.add(promptUrl);
    setPromptUrl(null);
  }, [promptUrl]);

  const save = useCallback(async () => {
    if (!promptUrl) return;
    setSaving(true);
    try {
      await saveContent({ url: promptUrl }, { entry_source: 'direct' });
      emit('content-saved');
      toast.show('저장 완료!', 'success');
    } catch (e: unknown) {
      const msg = isDuplicateContentUrlError(e)
        ? '이미 저장된 링크예요'
        : '저장에 실패했어요';
      toast.show(msg, 'error');
    } finally {
      dismissedRef.current.add(promptUrl);
      setPromptUrl(null);
      setSaving(false);
    }
  }, [promptUrl, toast]);

  return { promptUrl, saving, dismiss, save };
}
