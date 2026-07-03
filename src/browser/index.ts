/**
 * @aadviklabs/gdrive-uploader/browser
 * Browser-compatible Google Drive client for frontend applications
 */

// Main browser client
export { GoogleDriveBrowser } from './GoogleDriveBrowser';

// OAuth utilities
export {
  generatePKCEParams,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  revokeToken,
  storePKCEParams,
  retrievePKCEParams,
  clearPKCEParams,
  storeAuthTokens,
  getStoredAccessToken,
  getStoredUserEmail,
  clearAuthTokens,
  parseCallbackUrl,
  validateState,
  isTokenExpired,
} from './oauth';

// Types
export type {
  GoogleDriveBrowserConfig,
  OAuth2TokenResponse,
  PKCEParams,
  AuthState,
  BrowserUploadOptions,
  UploadProgress,
  BrowserUploadResult,
  BrowserFileMetadata,
  BrowserListOptions,
  BrowserListResponse,
  BrowserSearchOptions,
  CreateFolderOptions,
  DriveAPIError,
  DriveAPIResponse,
} from './types';

export {
  DEFAULT_SCOPES,
  DRIVE_API_BASE,
  DRIVE_UPLOAD_BASE,
  OAUTH2_AUTH_URL,
  OAUTH2_TOKEN_URL,
  OAUTH2_REVOKE_URL,
  STORAGE_KEYS,
} from './types';

