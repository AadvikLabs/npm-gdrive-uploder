/**
 * @aadviklabs/gdrive-uploader/react
 * React integration for Google Drive
 */

// Context and Provider
export { GoogleDriveProvider, useGoogleDriveContext } from './GoogleDriveContext';
export type { GoogleDriveContextType, GoogleDriveProviderProps } from './GoogleDriveContext';

// Hooks
export {
  useGoogleAuth,
  useFileUpload,
  useFileDownload,
  useFileList,
  useFileSearch,
  useFileDelete,
  useFolderOperations,
} from './hooks';

// Components
export { FileUploader } from './components/FileUploader';
export type { FileUploaderProps } from './components/FileUploader';

// Re-export browser types for convenience
export type {
  GoogleDriveBrowserConfig,
  AuthState,
  BrowserUploadOptions,
  BrowserUploadResult,
  BrowserFileMetadata,
  BrowserListOptions,
  BrowserListResponse,
  BrowserSearchOptions,
  UploadProgress,
} from '../browser/types';

