import { OnModuleInit } from '@nestjs/common';
import { GoogleDriveConfig, DriveUploadResult, DriveUploadOptions, DriveFileMetadata, ListFilesOptions, SearchFilesOptions } from '../types';
export declare class GoogleDriveService implements OnModuleInit {
    private readonly logger;
    private driveStorage;
    private config;
    constructor(config: GoogleDriveConfig);
    onModuleInit(): Promise<void>;
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
}
