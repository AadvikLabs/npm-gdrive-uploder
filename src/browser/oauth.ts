/**
 * OAuth2 PKCE (Proof Key for Code Exchange) implementation for browser
 * Secure authentication flow for Single Page Applications
 */

import {
  PKCEParams,
  OAuth2TokenResponse,
  OAUTH2_AUTH_URL,
  OAUTH2_TOKEN_URL,
  OAUTH2_REVOKE_URL,
  STORAGE_KEYS,
  DEFAULT_SCOPES,
} from './types';

/**
 * Generate a random string for code verifier
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

/**
 * Generate SHA-256 hash and base64url encode
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate PKCE parameters
 */
export async function generatePKCEParams(): Promise<PKCEParams> {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await sha256(codeVerifier);
  const state = generateRandomString(32);

  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

/**
 * Build OAuth2 authorization URL
 */
export function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string,
  scopes: string[] = DEFAULT_SCOPES,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return `${OAUTH2_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string,
): Promise<OAuth2TokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch(OAUTH2_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string; error_description?: string };
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  return response.json() as Promise<OAuth2TokenResponse>;
}

/**
 * Refresh access token using refresh token
 * Note: Refresh tokens are typically not available in browser-only flows
 * This is mainly for server-side use or if refresh token was obtained
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
): Promise<OAuth2TokenResponse> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token',
  });

  const response = await fetch(OAUTH2_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = (await response.json()) as { error: string; error_description?: string };
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  return response.json() as Promise<OAuth2TokenResponse>;
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  const params = new URLSearchParams({
    token,
  });

  const response = await fetch(OAUTH2_REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Token revocation failed');
  }
}

/**
 * Store PKCE parameters in session storage
 */
export function storePKCEParams(params: PKCEParams): void {
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, params.codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, params.state);
}

/**
 * Retrieve PKCE parameters from session storage
 */
export function retrievePKCEParams(): PKCEParams | null {
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  const state = sessionStorage.getItem(STORAGE_KEYS.STATE);

  if (!codeVerifier || !state) {
    return null;
  }

  return {
    codeVerifier,
    state,
    codeChallenge: '', // Not needed for retrieval
  };
}

/**
 * Clear PKCE parameters from session storage
 */
export function clearPKCEParams(): void {
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);
}

/**
 * Store authentication tokens
 */
export function storeAuthTokens(accessToken: string, expiresIn: number, userEmail?: string): void {
  const expiresAt = Date.now() + expiresIn * 1000;

  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

  if (userEmail) {
    sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, userEmail);
  }
}

/**
 * Retrieve stored access token
 */
export function getStoredAccessToken(): string | null {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAt = sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!token || !expiresAt) {
    return null;
  }

  // Check if token is expired
  if (Date.now() >= parseInt(expiresAt, 10)) {
    clearAuthTokens();
    return null;
  }

  return token;
}

/**
 * Check if access token is expired or about to expire
 */
export function isTokenExpired(bufferSeconds: number = 300): boolean {
  const expiresAt = sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!expiresAt) {
    return true;
  }

  const expiryTime = parseInt(expiresAt, 10);
  const bufferTime = bufferSeconds * 1000;

  return Date.now() >= expiryTime - bufferTime;
}

/**
 * Get stored user email
 */
export function getStoredUserEmail(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.USER_EMAIL);
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
}

/**
 * Parse OAuth2 callback URL
 */
export function parseCallbackUrl(url: string): {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
} {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  return {
    code: params.get('code') || undefined,
    state: params.get('state') || undefined,
    error: params.get('error') || undefined,
    error_description: params.get('error_description') || undefined,
  };
}

/**
 * Validate state parameter to prevent CSRF attacks
 */
export function validateState(receivedState: string, storedState: string): boolean {
  return receivedState === storedState;
}
