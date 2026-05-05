/**
 * Configuration options for Google Drive authentication
 */
export interface GoogleDriveConfig {
  /** Google OAuth2 Client ID */
  clientId: string;
  /** Google OAuth2 Client Secret */
  clientSecret: string;
  /** Google OAuth2 Refresh Token */
  refreshToken: string;
  /** Optional root folder ID for all operations */
  rootFolderId?: string;
  /** OAuth2 redirect URI (default: 'urn:ietf:wg:oauth:2.0:oob') */
  redirectUri?: string;
}

/**
 * Result returned after successful file upload
 */
export interface DriveUploadResult {
  /** Google Drive file ID */
  fileId: string;
  /** Name of the uploaded file */
  fileName: string;
  /** URL to access the file */
  fileUrl: string;
  /** Path of the file in Drive (folder/filename) */
  filePath: string;
  /** Size of the file in bytes */
  fileSize: number;
  /** MIME type of the file */
  contentType: string;
  /** Google Drive web view link */
  webViewLink?: string;
  /** Google Drive web content link (direct download) */
  webContentLink?: string;
}

/**
 * Options for uploading files to Google Drive
 */
export interface DriveUploadOptions {
  /** Folder name or path where file should be uploaded */
  folder?: string;
  /** Custom filename (if not provided, original name with timestamp is used) */
  fileName?: string;
  /** Whether to make the file publicly accessible */
  makePublic?: boolean;
  /** Description for the file */
  description?: string;
  /** Array of parent folder IDs (overrides folder option) */
  parents?: string[];
}

/**
 * Metadata information for a Google Drive file
 */
export interface DriveFileMetadata {
  /** Google Drive file ID */
  id: string;
  /** File name */
  name: string;
  /** File size in bytes (as string) */
  size: string;
  /** MIME type */
  mimeType: string;
  /** Creation timestamp */
  createdTime: string;
  /** Last modification timestamp */
  modifiedTime: string;
  /** Google Drive web view link */
  webViewLink: string;
  /** Google Drive web content link */
  webContentLink: string;
  /** Array of parent folder IDs */
  parents: string[];
}

/**
 * Options for listing files
 */
export interface ListFilesOptions {
  /** Folder ID to list files from */
  folderId?: string;
  /** Maximum number of files to return */
  pageSize?: number;
  /** Order by field (e.g., 'modifiedTime desc', 'name') */
  orderBy?: string;
  /** Query string for filtering files */
  query?: string;
}

/**
 * Options for searching files
 */
export interface SearchFilesOptions {
  /** Search query string */
  query: string;
  /** Folder ID to search within */
  folderId?: string;
  /** Maximum number of results */
  maxResults?: number;
}

