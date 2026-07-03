"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePKCEParams = generatePKCEParams;
exports.buildAuthorizationUrl = buildAuthorizationUrl;
exports.exchangeCodeForToken = exchangeCodeForToken;
exports.refreshAccessToken = refreshAccessToken;
exports.revokeToken = revokeToken;
exports.storePKCEParams = storePKCEParams;
exports.retrievePKCEParams = retrievePKCEParams;
exports.clearPKCEParams = clearPKCEParams;
exports.storeAuthTokens = storeAuthTokens;
exports.getStoredAccessToken = getStoredAccessToken;
exports.isTokenExpired = isTokenExpired;
exports.getStoredUserEmail = getStoredUserEmail;
exports.clearAuthTokens = clearAuthTokens;
exports.parseCallbackUrl = parseCallbackUrl;
exports.validateState = validateState;
const types_1 = require("./types");
function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
        .map((v) => charset[v % charset.length])
        .join('');
}
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
async function generatePKCEParams() {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await sha256(codeVerifier);
    const state = generateRandomString(32);
    return {
        codeVerifier,
        codeChallenge,
        state,
    };
}
function buildAuthorizationUrl(clientId, redirectUri, codeChallenge, state, scopes = types_1.DEFAULT_SCOPES) {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state,
        access_type: 'offline',
        prompt: 'consent',
    });
    return `${types_1.OAUTH2_AUTH_URL}?${params.toString()}`;
}
async function exchangeCodeForToken(code, codeVerifier, clientId, redirectUri) {
    const params = new URLSearchParams({
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
    });
    const response = await fetch(types_1.OAUTH2_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });
    if (!response.ok) {
        const error = (await response.json());
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }
    return response.json();
}
async function refreshAccessToken(refreshToken, clientId) {
    const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        grant_type: 'refresh_token',
    });
    const response = await fetch(types_1.OAUTH2_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });
    if (!response.ok) {
        const error = (await response.json());
        throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }
    return response.json();
}
async function revokeToken(token) {
    const params = new URLSearchParams({
        token,
    });
    const response = await fetch(types_1.OAUTH2_REVOKE_URL, {
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
function storePKCEParams(params) {
    sessionStorage.setItem(types_1.STORAGE_KEYS.CODE_VERIFIER, params.codeVerifier);
    sessionStorage.setItem(types_1.STORAGE_KEYS.STATE, params.state);
}
function retrievePKCEParams() {
    const codeVerifier = sessionStorage.getItem(types_1.STORAGE_KEYS.CODE_VERIFIER);
    const state = sessionStorage.getItem(types_1.STORAGE_KEYS.STATE);
    if (!codeVerifier || !state) {
        return null;
    }
    return {
        codeVerifier,
        state,
        codeChallenge: '',
    };
}
function clearPKCEParams() {
    sessionStorage.removeItem(types_1.STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(types_1.STORAGE_KEYS.STATE);
}
function storeAuthTokens(accessToken, expiresIn, userEmail) {
    const expiresAt = Date.now() + expiresIn * 1000;
    sessionStorage.setItem(types_1.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    sessionStorage.setItem(types_1.STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
    if (userEmail) {
        sessionStorage.setItem(types_1.STORAGE_KEYS.USER_EMAIL, userEmail);
    }
}
function getStoredAccessToken() {
    const token = sessionStorage.getItem(types_1.STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = sessionStorage.getItem(types_1.STORAGE_KEYS.EXPIRES_AT);
    if (!token || !expiresAt) {
        return null;
    }
    if (Date.now() >= parseInt(expiresAt, 10)) {
        clearAuthTokens();
        return null;
    }
    return token;
}
function isTokenExpired(bufferSeconds = 300) {
    const expiresAt = sessionStorage.getItem(types_1.STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) {
        return true;
    }
    const expiryTime = parseInt(expiresAt, 10);
    const bufferTime = bufferSeconds * 1000;
    return Date.now() >= expiryTime - bufferTime;
}
function getStoredUserEmail() {
    return sessionStorage.getItem(types_1.STORAGE_KEYS.USER_EMAIL);
}
function clearAuthTokens() {
    sessionStorage.removeItem(types_1.STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(types_1.STORAGE_KEYS.EXPIRES_AT);
    sessionStorage.removeItem(types_1.STORAGE_KEYS.USER_EMAIL);
}
function parseCallbackUrl(url) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    return {
        code: params.get('code') || undefined,
        state: params.get('state') || undefined,
        error: params.get('error') || undefined,
        error_description: params.get('error_description') || undefined,
    };
}
function validateState(receivedState, storedState) {
    return receivedState === storedState;
}
