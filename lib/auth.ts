import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const googleClientIds = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleClientIds.iosClientId,
    webClientId: googleClientIds.webClientId,
  });

  const signInWithGoogle = async () => {
    const result = await promptAsync();

    if (result.type !== 'success') {
      return { error: 'Google sign-in was cancelled' };
    }

    const idToken = result.params.id_token;
    if (!idToken) {
      return { error: 'No ID token returned from Google' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { error: error.message };
    }

    return { data };
  };

  return {
    signInWithGoogle,
    isReady: !!request,
  };
}
