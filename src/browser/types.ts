/**
 * Browser-specific type definitions for Google Drive integration
 */

/**
 * Configuration for browser-based Google Drive client
 */
export interface GoogleDriveBrowserConfig {
  /** Google OAuth2 Client ID (public, safe to expose in browser) */
  clientId: string;
  /** OAuth2 redirect URI (must match Google Cloud Console configuration) */
  redirectUri?: string;
  /** OAuth2 scopes to request */
  scopes?: string[];
  /** Optional root folder ID for all operations */
  rootFolderId?: string;
}

/**
 * OAuth2 token response
 */
export interface OAuth2TokenResponse {
  /** Access token for API calls */
  access_token: string;
  /** Token type (usually 'Bearer') */
  token_type: string;
  /** Expiration time in seconds */
  expires_in: number;
  /** Refresh token (only on first authorization) */
  refresh_token?: string;
  /** Granted scopes */
  scope: string;
}

/**
 * OAuth2 PKCE parameters
 */
export interface PKCEParams {
  /** Code verifier (random string) */
  codeVerifier: string;
  /** Code challenge (SHA-256 hash of verifier) */
  codeChallenge: string;
  /** State parameter for CSRF protection */
  state: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Access token */
  accessToken: string | null;
  /** Token expiration timestamp */
  expiresAt: number | null;
  /** User email (if available) */
  userEmail?: string;
}

/**
 * File upload options for browser
 */
export interface BrowserUploadOptions {
  /** Folder name or path where file should be uploaded */
  folder?: string;
  /** Custom filename (if not provided, uses File.name) */
  fileName?: string;
  /** Whether to make the file publicly accessible */
  makePublic?: boolean;
  /** Description for the file */
  description?: string;
  /** Array of parent folder IDs (overrides folder option) */
  parents?: string[];
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * File upload result (browser version)
 */
export interface BrowserUploadResult {
  /** Google Drive file ID */
  fileId: string;
  /** Name of the uploaded file */
  fileName: string;
  /** URL to access the file */
  fileUrl: string;
  /** Size of the file in bytes */
  fileSize: number;
  /** MIME type of the file */
  mimeType: string;
  /** Google Drive web view link */
  webViewLink?: string;
  /** Google Drive web content link (direct download) */
  webContentLink?: string;
}

/**
 * File metadata (browser version)
 */
export interface BrowserFileMetadata {
  /** Google Drive file ID */
  id: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Creation timestamp */
  createdTime: string;
  /** Last modification timestamp */
  modifiedTime: string;
  /** Google Drive web view link */
  webViewLink: string;
  /** Google Drive web content link */
  webContentLink?: string;
  /** Array of parent folder IDs */
  parents?: string[];
  /** Thumbnail link */
  thumbnailLink?: string;
  /** Icon link */
  iconLink?: string;
}

/**
 * Options for listing files (browser version)
 */
export interface BrowserListOptions {
  /** Folder ID to list files from */
  folderId?: string;
  /** Maximum number of files to return */
  pageSize?: number;
  /** Order by field (e.g., 'modifiedTime desc', 'name') */
  orderBy?: string;
  /** Query string for filtering files */
  query?: string;
  /** Page token for pagination */
  pageToken?: string;
}

/**
 * List files response
 */
export interface BrowserListResponse {
  /** Array of files */
  files: BrowserFileMetadata[];
  /** Next page token (if more results available) */
  nextPageToken?: string;
  /** Whether there are more results */
  hasMore: boolean;
}

/**
 * Options for searching files
 */
export interface BrowserSearchOptions {
  /** Search query string */
  query: string;
  /** Folder ID to search within */
  folderId?: string;
  /** Maximum number of results */
  maxResults?: number;
  /** MIME type filter */
  mimeType?: string;
}

/**
 * Folder creation options
 */
export interface CreateFolderOptions {
  /** Parent folder ID */
  parentId?: string;
  /** Folder description */
  description?: string;
  /** Folder color (Google Drive color) */
  folderColorRgb?: string;
}

/**
 * Error response from Google Drive API
 */
export interface DriveAPIError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
  /** Error status */
  status: string;
  /** Additional error details */
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
  }>;
}

/**
 * Google Drive API response wrapper
 */
export interface DriveAPIResponse<T> {
  /** Response data */
  data?: T;
  /** Error information */
  error?: DriveAPIError;
  /** HTTP status code */
  status: number;
}

/**
 * Default OAuth2 scopes for Google Drive
 */
export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // Access to files created by the app
  'https://www.googleapis.com/auth/userinfo.email', // User email
];

/**
 * Google Drive API endpoints
 */
export const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
export const OAUTH2_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const OAUTH2_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const OAUTH2_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

/**
 * Storage keys for browser storage
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gdrive_access_token',
  EXPIRES_AT: 'gdrive_expires_at',
  USER_EMAIL: 'gdrive_user_email',
  CODE_VERIFIER: 'gdrive_code_verifier',
  STATE: 'gdrive_state',
} as const;

