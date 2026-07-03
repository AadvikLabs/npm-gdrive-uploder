"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGoogleAuth = useGoogleAuth;
exports.useFileUpload = useFileUpload;
exports.useFileDownload = useFileDownload;
exports.useFileList = useFileList;
exports.useFileSearch = useFileSearch;
exports.useFileDelete = useFileDelete;
exports.useFolderOperations = useFolderOperations;
const react_1 = require("react");
const GoogleDriveContext_1 = require("./GoogleDriveContext");
function useGoogleAuth() {
    const { authState, signIn, signOut, isInitialized } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [isSigningIn, setIsSigningIn] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleSignIn = (0, react_1.useCallback)(async (usePopup = true) => {
        setIsSigningIn(true);
        setError(null);
        try {
            await signIn(usePopup);
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsSigningIn(false);
        }
    }, [signIn]);
    const handleSignOut = (0, react_1.useCallback)(async () => {
        setError(null);
        try {
            await signOut();
        }
        catch (err) {
            setError(err);
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
function useFileUpload() {
    const { drive } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [progress, setProgress] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [result, setResult] = (0, react_1.useState)(null);
    const uploadFile = (0, react_1.useCallback)(async (file, options) => {
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
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsUploading(false);
        }
    }, [drive]);
    const reset = (0, react_1.useCallback)(() => {
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
function useFileDownload() {
    const { drive } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [isDownloading, setIsDownloading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const downloadFile = (0, react_1.useCallback)(async (fileId, fileName) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        setIsDownloading(true);
        setError(null);
        try {
            const blob = await drive.downloadFile(fileId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsDownloading(false);
        }
    }, [drive]);
    return {
        downloadFile,
        isDownloading,
        error,
    };
}
function useFileList(options) {
    const { drive } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [files, setFiles] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [hasMore, setHasMore] = (0, react_1.useState)(false);
    const [nextPageToken, setNextPageToken] = (0, react_1.useState)();
    const loadFiles = (0, react_1.useCallback)(async (loadOptions) => {
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
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [drive, options]);
    const loadMore = (0, react_1.useCallback)(async () => {
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
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [drive, options, nextPageToken]);
    const refresh = (0, react_1.useCallback)(() => {
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
function useFileSearch() {
    const { drive } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [results, setResults] = (0, react_1.useState)([]);
    const [isSearching, setIsSearching] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const search = (0, react_1.useCallback)(async (options) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        setIsSearching(true);
        setError(null);
        try {
            const searchResults = await drive.searchFiles(options);
            setResults(searchResults);
            return searchResults;
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsSearching(false);
        }
    }, [drive]);
    const clear = (0, react_1.useCallback)(() => {
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
function useFileDelete() {
    const { drive } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [isDeleting, setIsDeleting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const deleteFile = (0, react_1.useCallback)(async (fileId) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        setIsDeleting(true);
        setError(null);
        try {
            await drive.deleteFile(fileId);
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsDeleting(false);
        }
    }, [drive]);
    return {
        deleteFile,
        isDeleting,
        error,
    };
}
function useFolderOperations() {
    const { drive } = (0, GoogleDriveContext_1.useGoogleDriveContext)();
    const [isCreating, setIsCreating] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const createFolder = (0, react_1.useCallback)(async (folderName, parentId) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        setIsCreating(true);
        setError(null);
        try {
            const folderId = await drive.createFolder(folderName, { parentId });
            return folderId;
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsCreating(false);
        }
    }, [drive]);
    const getOrCreateFolder = (0, react_1.useCallback)(async (folderName, parentId) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        setIsCreating(true);
        setError(null);
        try {
            const folderId = await drive.getOrCreateFolder(folderName, parentId);
            return folderId;
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
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
