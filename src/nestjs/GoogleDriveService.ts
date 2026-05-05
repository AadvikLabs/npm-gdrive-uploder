import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleDriveStorage } from '../GoogleDriveStorage';
import {
  GoogleDriveConfig,
  DriveUploadResult,
  DriveUploadOptions,
  DriveFileMetadata,
  ListFilesOptions,
  SearchFilesOptions,
} from '../types';

/**
 * NestJS Injectable Service for Google Drive operations
 * Wraps GoogleDriveStorage with NestJS lifecycle hooks and logging
 */
@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveService.name);
  private driveStorage: GoogleDriveStorage | null = null;
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  async onModuleInit() {
    try {
      this.driveStorage = new GoogleDriveStorage(this.config);
      this.logger.log('Google Drive Service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Google Drive Service: ${(error as Error).message}`);
    }
  }

  /**
   * Check if Google Drive is available
   */
  isAvailable(): boolean {
    return this.driveStorage?.isAvailable() ?? false;
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    options?: DriveUploadOptions,
  ): Promise<DriveUploadResult> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.uploadFile(fileBuffer, originalFileName, options);
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.downloadFile(fileId);
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.deleteFile(fileId);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.getFileMetadata(fileId);
  }

  /**
   * List files in a folder
   */
  async listFiles(options?: ListFilesOptions): Promise<DriveFileMetadata[]> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.listFiles(options);
  }

  /**
   * Create a folder
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.createFolder(folderName, parentFolderId);
  }

  /**
   * Get or create a folder
   */
  async getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.getOrCreateFolder(folderName, parentFolderId);
  }

  /**
   * Search files
   */
  async searchFiles(options: SearchFilesOptions): Promise<DriveFileMetadata[]> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.searchFiles(options);
  }

  /**
   * Make a file public
   */
  async makeFilePublic(fileId: string, isSharedDrive?: boolean): Promise<void> {
    if (!this.driveStorage) {
      throw new Error('Google Drive Service is not initialized');
    }
    return this.driveStorage.makeFilePublic(fileId, isSharedDrive);
  }
}

