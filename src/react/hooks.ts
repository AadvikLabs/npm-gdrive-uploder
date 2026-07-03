/**
 * React hooks for Google Drive operations
 */

import { useState, useCallback } from 'react';
import { useGoogleDriveContext } from './GoogleDriveContext';
import type {
  BrowserUploadOptions,
  BrowserUploadResult,
  BrowserFileMetadata,
  BrowserListOptions,
  BrowserListResponse,
  BrowserSearchOptions,
  UploadProgress,
} from '../browser/types';

/**
 * Hook for Google Drive authentication
 */
export function useGoogleAuth() {
  const { authState, signIn, signOut, isInitialized } = useGoogleDriveContext();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSignIn = useCallback(async (usePopup: boolean = true) => {
    setIsSigningIn(true);
    setError(null);

    try {
      await signIn(usePopup);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }, [signIn]);

  const handleSignOut = useCallback(async () => {
    setError(null);

    try {
      await signOut();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [signOut]);

  return {
    isAuthenticated: authState.isAuthenticated,
    userEmail: authState.userEmail,
    isInitialized,
    isSigningIn,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}

/**
 * Hook for file upload operations
 */
export function useFileUpload() {
  const { drive } = useGoogleDriveContext();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<BrowserUploadResult | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    options?: BrowserUploadOptions,
  ): Promise<BrowserUploadResult> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsUploading(true);
    setProgress(null);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await drive.uploadFile(file, {
        ...options,
        onProgress: (prog) => {
          setProgress(prog);
          options?.onProgress?.(prog);
        },
      });

      setResult(uploadResult);
      return uploadResult;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [drive]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    result,
    reset,
  };
}

/**
 * Hook for file download operations
 */
export function useFileDownload() {
  const { drive } = useGoogleDriveContext();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadFile = useCallback(async (
    fileId: string,
    fileName?: string,
  ): Promise<void> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsDownloading(true);
    setError(null);

    try {
      const blob = await drive.downloadFile(fileId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  }, [drive]);

  return {
    downloadFile,
    isDownloading,
    error,
  };
}

/**
 * Hook for listing files
 */
export function useFileList(options?: BrowserListOptions) {
  const { drive } = useGoogleDriveContext();
  const [files, setFiles] = useState<BrowserFileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  const loadFiles = useCallback(async (
    loadOptions?: BrowserListOptions,
  ): Promise<BrowserListResponse> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await drive.listFiles({
        ...options,
        ...loadOptions,
      });

      setFiles(response.files);
      setHasMore(response.hasMore);
      setNextPageToken(response.nextPageToken);

      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [drive, options]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!nextPageToken || !drive) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await drive.listFiles({
        ...options,
        pageToken: nextPageToken,
      });

      setFiles((prev) => [...prev, ...response.files]);
      setHasMore(response.hasMore);
      setNextPageToken(response.nextPageToken);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [drive, options, nextPageToken]);

  const refresh = useCallback(() => {
    return loadFiles();
  }, [loadFiles]);

  return {
    files,
    isLoading,
    error,
    hasMore,
    loadFiles,
    loadMore,
    refresh,
  };
}

/**
 * Hook for searching files
 */
export function useFileSearch() {
  const { drive } = useGoogleDriveContext();
  const [results, setResults] = useState<BrowserFileMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (
    options: BrowserSearchOptions,
  ): Promise<BrowserFileMetadata[]> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await drive.searchFiles(options);
      setResults(searchResults);
      return searchResults;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, [drive]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    search,
    clear,
  };
}

/**
 * Hook for file deletion
 */
export function useFileDelete() {
  const { drive } = useGoogleDriveContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsDeleting(true);
    setError(null);

    try {
      await drive.deleteFile(fileId);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [drive]);

  return {
    deleteFile,
    isDeleting,
    error,
  };
}

/**
 * Hook for folder operations
 */
export function useFolderOperations() {
  const { drive } = useGoogleDriveContext();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createFolder = useCallback(async (
    folderName: string,
    parentId?: string,
  ): Promise<string> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsCreating(true);
    setError(null);

    try {
      const folderId = await drive.createFolder(folderName, { parentId });
      return folderId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [drive]);

  const getOrCreateFolder = useCallback(async (
    folderName: string,
    parentId?: string,
  ): Promise<string> => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    setIsCreating(true);
    setError(null);

    try {
      const folderId = await drive.getOrCreateFolder(folderName, parentId);
      return folderId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [drive]);

  return {
    createFolder,
    getOrCreateFolder,
    isCreating,
    error,
  };
}

