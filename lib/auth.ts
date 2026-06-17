import { exchangeCodeAsync } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const iosRedirectUri = 'com.hyerimhan.nook:/oauthredirect';

const googleClientIds = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export function useGoogleAuth() {
  const [request, , promptAsync] = Google.useAuthRequest({
    iosClientId: googleClientIds.iosClientId,
    webClientId: googleClientIds.webClientId,
    shouldAutoExchangeCode: false,
  }, {
    native: iosRedirectUri,
  });

  const signInWithGoogle = async () => {
    const result = await promptAsync();

    if (result.type !== 'success') {
      return { error: 'Google sign-in was cancelled' };
    }

    let idToken: string | undefined = result.params.id_token;

    if (!idToken && result.params.code && request?.codeVerifier && googleClientIds.iosClientId) {
      const tokenResponse = await exchangeCodeAsync({
        clientId: googleClientIds.iosClientId,
        code: result.params.code,
        redirectUri: iosRedirectUri,
        extraParams: {
          code_verifier: request.codeVerifier,
        },
      }, Google.discovery);

      idToken = tokenResponse.idToken;
    }

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

export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { error: 'No identity token returned from Apple' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { error: 'Apple sign-in was cancelled' };
    }
    return { error: e.message || 'Apple sign-in failed' };
  }
}
