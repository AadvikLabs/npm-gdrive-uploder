/**
 * @aadviklabs/gdrive-uploader
 * A comprehensive Google Drive file upload and management library
 */

// Main class
export { GoogleDriveStorage } from './GoogleDriveStorage';

// Types
export type {
  GoogleDriveConfig,
  DriveUploadResult,
  DriveUploadOptions,
  DriveFileMetadata,
  ListFilesOptions,
  SearchFilesOptions,
} from './types';

// Utilities
export { getContentType, generateFileName } from './utils/content-type';

// NestJS Module (optional - only if NestJS is installed)
// export { GoogleDriveModule } from './nestjs/GoogleDriveModule';
// export { GoogleDriveService } from './nestjs/GoogleDriveService';
