import type { BrowserUploadOptions, BrowserUploadResult, BrowserFileMetadata, BrowserListOptions, BrowserListResponse, BrowserSearchOptions, UploadProgress } from '../browser/types';
export declare function useGoogleAuth(): {
    isAuthenticated: boolean;
    userEmail: string | undefined;
    isInitialized: boolean;
    isSigningIn: boolean;
    error: Error | null;
    signIn: (usePopup?: boolean) => Promise<void>;
    signOut: () => Promise<void>;
};
export declare function useFileUpload(): {
    uploadFile: (file: File, options?: BrowserUploadOptions) => Promise<BrowserUploadResult>;
    isUploading: boolean;
    progress: UploadProgress | null;
    error: Error | null;
    result: BrowserUploadResult | null;
    reset: () => void;
};
export declare function useFileDownload(): {
    downloadFile: (fileId: string, fileName?: string) => Promise<void>;
    isDownloading: boolean;
    error: Error | null;
};
export declare function useFileList(options?: BrowserListOptions): {
    files: BrowserFileMetadata[];
    isLoading: boolean;
    error: Error | null;
    hasMore: boolean;
    loadFiles: (loadOptions?: BrowserListOptions) => Promise<BrowserListResponse>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<BrowserListResponse>;
};
export declare function useFileSearch(): {
    results: BrowserFileMetadata[];
    isSearching: boolean;
    error: Error | null;
    search: (options: BrowserSearchOptions) => Promise<BrowserFileMetadata[]>;
    clear: () => void;
};
export declare function useFileDelete(): {
    deleteFile: (fileId: string) => Promise<void>;
    isDeleting: boolean;
    error: Error | null;
};
export declare function useFolderOperations(): {
    createFolder: (folderName: string, parentId?: string) => Promise<string>;
    getOrCreateFolder: (folderName: string, parentId?: string) => Promise<string>;
    isCreating: boolean;
    error: Error | null;
};
