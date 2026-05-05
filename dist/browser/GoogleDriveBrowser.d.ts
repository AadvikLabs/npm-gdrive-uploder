import { GoogleDriveBrowserConfig, AuthState, BrowserUploadOptions, BrowserUploadResult, BrowserFileMetadata, BrowserListOptions, BrowserListResponse, BrowserSearchOptions, CreateFolderOptions } from './types';
export declare class GoogleDriveBrowser {
    private config;
    private authState;
    constructor(config: GoogleDriveBrowserConfig);
    getAuthState(): AuthState;
    isAuthenticated(): boolean;
    signIn(usePopup?: boolean): Promise<void>;
    handleAuthCallback(callbackUrl?: string): Promise<void>;
    signOut(): Promise<void>;
    private fetchUserEmail;
    private makeRequest;
    uploadFile(file: File, options?: BrowserUploadOptions): Promise<BrowserUploadResult>;
    downloadFile(fileId: string): Promise<Blob>;
    deleteFile(fileId: string): Promise<void>;
    getFileMetadata(fileId: string): Promise<BrowserFileMetadata>;
    listFiles(options?: BrowserListOptions): Promise<BrowserListResponse>;
    searchFiles(options: BrowserSearchOptions): Promise<BrowserFileMetadata[]>;
    createFolder(folderName: string, options?: CreateFolderOptions): Promise<string>;
    getOrCreateFolder(folderName: string, parentId?: string): Promise<string>;
    makeFilePublic(fileId: string): Promise<void>;
    getStorageQuota(): Promise<{
        limit: number;
        usage: number;
        usageInDrive: number;
        usageInTrash: number;
    }>;
}
