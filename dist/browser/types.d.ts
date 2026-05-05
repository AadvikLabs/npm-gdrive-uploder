export interface GoogleDriveBrowserConfig {
    clientId: string;
    redirectUri?: string;
    scopes?: string[];
    rootFolderId?: string;
}
export interface OAuth2TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
}
export interface PKCEParams {
    codeVerifier: string;
    codeChallenge: string;
    state: string;
}
export interface AuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    expiresAt: number | null;
    userEmail?: string;
}
export interface BrowserUploadOptions {
    folder?: string;
    fileName?: string;
    makePublic?: boolean;
    description?: string;
    parents?: string[];
    onProgress?: (progress: UploadProgress) => void;
}
export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}
export interface BrowserUploadResult {
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    webViewLink?: string;
    webContentLink?: string;
}
export interface BrowserFileMetadata {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string;
    webContentLink?: string;
    parents?: string[];
    thumbnailLink?: string;
    iconLink?: string;
}
export interface BrowserListOptions {
    folderId?: string;
    pageSize?: number;
    orderBy?: string;
    query?: string;
    pageToken?: string;
}
export interface BrowserListResponse {
    files: BrowserFileMetadata[];
    nextPageToken?: string;
    hasMore: boolean;
}
export interface BrowserSearchOptions {
    query: string;
    folderId?: string;
    maxResults?: number;
    mimeType?: string;
}
export interface CreateFolderOptions {
    parentId?: string;
    description?: string;
    folderColorRgb?: string;
}
export interface DriveAPIError {
    code: number;
    message: string;
    status: string;
    errors?: Array<{
        domain: string;
        reason: string;
        message: string;
    }>;
}
export interface DriveAPIResponse<T> {
    data?: T;
    error?: DriveAPIError;
    status: number;
}
export declare const DEFAULT_SCOPES: string[];
export declare const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
export declare const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
export declare const OAUTH2_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export declare const OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";
export declare const OAUTH2_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export declare const STORAGE_KEYS: {
    readonly ACCESS_TOKEN: "gdrive_access_token";
    readonly EXPIRES_AT: "gdrive_expires_at";
    readonly USER_EMAIL: "gdrive_user_email";
    readonly CODE_VERIFIER: "gdrive_code_verifier";
    readonly STATE: "gdrive_state";
};
