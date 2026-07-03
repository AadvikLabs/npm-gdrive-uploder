import { google } from 'googleapis';
import * as stream from 'stream';
import {
  GoogleDriveConfig,
  DriveUploadResult,
  DriveUploadOptions,
  DriveFileMetadata,
  ListFilesOptions,
  SearchFilesOptions,
} from './types';
import { getContentType, generateFileName } from './utils/content-type';

/**
 * Google Drive Storage Service
 * Provides comprehensive file upload, download, and management functionality for Google Drive
 */
export class GoogleDriveStorage {
  private drive: any;
  private isInitialized = false;
  private rootFolderId?: string;
  private config: GoogleDriveConfig;

  /**
   * Create a new GoogleDriveStorage instance
   * @param config - Google Drive configuration options
   */
  constructor(config: GoogleDriveConfig) {
    this.config = config;
    this.initializeGoogleDrive();
  }

  /**
   * Initialize Google Drive API with OAuth2 credentials
   */
  private async initializeGoogleDrive(): Promise<void> {
    try {
      const {
        clientId,
        clientSecret,
        refreshToken,
        rootFolderId,
        redirectUri,
      } = this.config;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing required Google Drive credentials');
      }

      // Initialize OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri || 'urn:ietf:wg:oauth:2.0:oob',
      );

      // Set the refresh token
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      // Initialize Drive API with OAuth2 client
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.rootFolderId = rootFolderId;
      this.isInitialized = true;

      // Test the connection
      await this.testConnection();
    } catch (error) {
      this.isInitialized = false;
      throw new Error(
        `Failed to initialize Google Drive: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Test the Google Drive connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.drive.about.get({ fields: 'user' });
    } catch (error) {
      this.isInitialized = false;
      throw new Error(
        `Google Drive connection test failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Check if Google Drive is properly initialized and available
   */
  public isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Upload a file to Google Drive
   * @param fileBuffer - File content as Buffer
   * @param originalFileName - Original name of the file
   * @param options - Upload options
   * @returns Upload result with file details
   */
  public async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    options: DriveUploadOptions = {},
  ): Promise<DriveUploadResult> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const {
        folder = 'uploads',
        fileName = generateFileName(originalFileName),
        makePublic = false,
        description = `Uploaded - ${new Date().toISOString()}`,
        parents = [],
      } = options;

      // Use provided parents, or find/create the specified folder
      let finalParents = parents;
      if (finalParents.length === 0) {
        const folderId = await this.getOrCreateFolder(folder);
        finalParents = [folderId];
      }

      // Create readable stream from buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileBuffer);

      // Upload file metadata
      const fileMetadata = {
        name: fileName,
        description,
        parents: finalParents,
      };

      // Upload file
      const media = {
        mimeType: getContentType(originalFileName),
        body: bufferStream,
      };

      // Check if we're working with a Shared Drive
      const isSharedDrive = await this.isSharedDriveFolder(finalParents[0]);

      const uploadParams: any = {
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,size,mimeType,webViewLink,webContentLink,parents',
      };

      // Add supportsAllDrives parameter for Shared Drive support
      if (isSharedDrive) {
        uploadParams.supportsAllDrives = true;
      }

      const response = await this.drive.files.create(uploadParams);
      const file = response.data;

      // Make file public if requested
      if (makePublic) {
        await this.makeFilePublic(file.id, isSharedDrive);
      }

      const result: DriveUploadResult = {
        fileId: file.id,
        fileName: file.name,
        fileUrl: file.webContentLink || file.webViewLink,
        filePath: `${folder}/${file.name}`,
        fileSize: fileBuffer.length,
        contentType: file.mimeType,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
      };

      return result;
    } catch (error) {
      throw new Error(`Upload failed: ${(error as Error).message}`);
    }
  }

  /**
   * Download a file from Google Drive
   * @param fileId - Google Drive file ID
   * @returns File content as Buffer
   */
  public async downloadFile(fileId: string): Promise<Buffer> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const isSharedDrive = await this.isFileInSharedDrive(fileId);

      const downloadParams: any = {
        fileId: fileId,
        alt: 'media',
      };

      if (isSharedDrive) {
        downloadParams.supportsAllDrives = true;
      }

      const response = await this.drive.files.get(downloadParams, {
        responseType: 'stream',
      });

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        response.data.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.data.on('end', () => resolve(Buffer.concat(chunks)));
        response.data.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Download failed: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a file from Google Drive
   * @param fileId - Google Drive file ID
   */
  public async deleteFile(fileId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const isSharedDrive = await this.isFileInSharedDrive(fileId);
      const deleteParams: any = { fileId };

      if (isSharedDrive) {
        deleteParams.supportsAllDrives = true;
      }

      await this.drive.files.delete(deleteParams);
    } catch (error) {
      throw new Error(`Delete failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get file metadata
   * @param fileId - Google Drive file ID
   * @returns File metadata
   */
  public async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const isSharedDrive = await this.isFileInSharedDrive(fileId);

      const metadataParams: any = {
        fileId,
        fields:
          'id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents',
      };

      if (isSharedDrive) {
        metadataParams.supportsAllDrives = true;
      }

      const response = await this.drive.files.get(metadataParams);
      return response.data;
    } catch (error) {
      throw new Error(`Get metadata failed: ${(error as Error).message}`);
    }
  }

  /**
   * List files in a folder
   * @param options - List options
   * @returns Array of file metadata
   */
  public async listFiles(
    options: ListFilesOptions = {},
  ): Promise<DriveFileMetadata[]> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const {
        folderId,
        pageSize = 100,
        orderBy = 'modifiedTime desc',
        query,
      } = options;

      const searchQuery =
        query ||
        (folderId
          ? `'${folderId}' in parents and trashed=false`
          : 'trashed=false');

      const isSharedDrive = folderId
        ? await this.isSharedDriveFolder(folderId)
        : false;

      const listParams: any = {
        q: searchQuery,
        pageSize,
        fields:
          'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents)',
        orderBy,
      };

      if (isSharedDrive) {
        listParams.supportsAllDrives = true;
        listParams.includeItemsFromAllDrives = true;
      }

      const response = await this.drive.files.list(listParams);
      return response.data.files || [];
    } catch (error) {
      throw new Error(`List files failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a folder in Google Drive
   * @param folderName - Name of the folder to create
   * @param parentFolderId - Optional parent folder ID
   * @returns Created folder ID
   */
  public async createFolder(
    folderName: string,
    parentFolderId?: string,
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const parents = parentFolderId
        ? [parentFolderId]
        : this.rootFolderId
          ? [this.rootFolderId]
          : [];

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents,
      };

      const isSharedDrive = parentFolderId
        ? await this.isSharedDriveFolder(parentFolderId)
        : this.rootFolderId
          ? await this.isSharedDriveFolder(this.rootFolderId)
          : false;

      const createParams: any = {
        requestBody: fileMetadata,
        fields: 'id',
      };

      if (isSharedDrive) {
        createParams.supportsAllDrives = true;
      }

      const response = await this.drive.files.create(createParams);
      return response.data.id;
    } catch (error) {
      throw new Error(`Create folder failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get or create a folder (creates if doesn't exist)
   * @param folderName - Name of the folder
   * @param parentFolderId - Optional parent folder ID
   * @returns Folder ID
   */
  public async getOrCreateFolder(
    folderName: string,
    parentFolderId?: string,
  ): Promise<string> {
    try {
      const parent = parentFolderId || this.rootFolderId;
      const query = parent
        ? `name='${folderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const isSharedDrive = parent
        ? await this.isSharedDriveFolder(parent)
        : false;

      const listParams: any = {
        q: query,
        fields: 'files(id,name)',
      };

      if (isSharedDrive) {
        listParams.supportsAllDrives = true;
        listParams.includeItemsFromAllDrives = true;
      }

      const response = await this.drive.files.list(listParams);

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Folder doesn't exist, create it
      return await this.createFolder(folderName, parentFolderId);
    } catch (error) {
      throw new Error(
        `Get or create folder failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Search files by name or content
   * @param options - Search options
   * @returns Array of matching files
   */
  public async searchFiles(
    options: SearchFilesOptions,
  ): Promise<DriveFileMetadata[]> {
    if (!this.isInitialized) {
      throw new Error('Google Drive Storage is not initialized');
    }

    try {
      const { query, folderId, maxResults = 100 } = options;

      const searchQuery = folderId
        ? `name contains '${query}' and '${folderId}' in parents and trashed=false`
        : `name contains '${query}' and trashed=false`;

      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: maxResults,
        fields:
          'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      throw new Error(`Search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Make a file publicly accessible
   * @param fileId - Google Drive file ID
   * @param isSharedDrive - Whether the file is in a Shared Drive
   */
  public async makeFilePublic(
    fileId: string,
    isSharedDrive: boolean = false,
  ): Promise<void> {
    try {
      const permissionParams: any = {
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      };

      if (isSharedDrive) {
        permissionParams.supportsAllDrives = true;
      }

      await this.drive.permissions.create(permissionParams);
    } catch (error) {
      throw new Error(`Make public failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a folder is in a Shared Drive
   * @param folderId - Folder ID to check
   * @returns True if in Shared Drive
   */
  private async isSharedDriveFolder(folderId: string): Promise<boolean> {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'driveId',
        supportsAllDrives: true,
      });

      return !!response.data.driveId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a file is in a Shared Drive
   * @param fileId - File ID to check
   * @returns True if in Shared Drive
   */
  private async isFileInSharedDrive(fileId: string): Promise<boolean> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'driveId',
        supportsAllDrives: true,
      });

      return !!response.data.driveId;
    } catch (error) {
      return false;
    }
  }
}
