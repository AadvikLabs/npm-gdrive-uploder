import { GoogleDriveConfig, DriveUploadResult, DriveUploadOptions, DriveFileMetadata, ListFilesOptions, SearchFilesOptions } from './types';
export declare class GoogleDriveStorage {
    private drive;
    private isInitialized;
    private rootFolderId?;
    private config;
    constructor(config: GoogleDriveConfig);
    private initializeGoogleDrive;
    private testConnection;
    isAvailable(): boolean;
    uploadFile(fileBuffer: Buffer, originalFileName: string, options?: DriveUploadOptions): Promise<DriveUploadResult>;
    downloadFile(fileId: string): Promise<Buffer>;
    deleteFile(fileId: string): Promise<void>;
    getFileMetadata(fileId: string): Promise<DriveFileMetadata>;
    listFiles(options?: ListFilesOptions): Promise<DriveFileMetadata[]>;
    createFolder(folderName: string, parentFolderId?: string): Promise<string>;
    getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string>;
    searchFiles(options: SearchFilesOptions): Promise<DriveFileMetadata[]>;
    makeFilePublic(fileId: string, isSharedDrive?: boolean): Promise<void>;
    private isSharedDriveFolder;
    private isFileInSharedDrive;
}
