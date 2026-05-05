export interface GoogleDriveConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    rootFolderId?: string;
    redirectUri?: string;
}
export interface DriveUploadResult {
    fileId: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
    fileSize: number;
    contentType: string;
    webViewLink?: string;
    webContentLink?: string;
}
export interface DriveUploadOptions {
    folder?: string;
    fileName?: string;
    makePublic?: boolean;
    description?: string;
    parents?: string[];
}
export interface DriveFileMetadata {
    id: string;
    name: string;
    size: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string;
    webContentLink: string;
    parents: string[];
}
export interface ListFilesOptions {
    folderId?: string;
    pageSize?: number;
    orderBy?: string;
    query?: string;
}
export interface SearchFilesOptions {
    query: string;
    folderId?: string;
    maxResults?: number;
}
