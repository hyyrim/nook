import { supabase } from './supabase';

// 웹 인증은 OAuth 리다이렉트 방식. 네이티브(auth.ts)의 promptAsync + signInWithIdToken 대신
// signInWithOAuth로 전체 페이지 리다이렉트 → 복귀 시 supabase가 URL에서 세션을 잡는다
// (supabase.ts의 detectSessionInUrl=true, 웹에서만). Metro가 웹 빌드에서 이 파일을 auth.ts 대신 해소한다.

function webRedirectTo(): string | undefined {
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

async function oauth(provider: 'google' | 'apple'): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: webRedirectTo() },
  });
  if (error) return { error: error.message };
  // 성공 시 브라우저가 provider로 리다이렉트되어 이 이후 코드는 실질적으로 도달하지 않음.
  return {};
}

export function useGoogleAuth() {
  return {
    signInWithGoogle: () => oauth('google'),
    isReady: true,
  };
}

export function signInWithApple() {
  return oauth('apple');
}
