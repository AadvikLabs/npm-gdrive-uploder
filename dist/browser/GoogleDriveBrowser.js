"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveBrowser = void 0;
const types_1 = require("./types");
const oauth_1 = require("./oauth");
class GoogleDriveBrowser {
    constructor(config) {
        this.config = {
            ...config,
            scopes: config.scopes || types_1.DEFAULT_SCOPES,
            redirectUri: config.redirectUri || window.location.origin,
        };
        const accessToken = (0, oauth_1.getStoredAccessToken)();
        const userEmail = (0, oauth_1.getStoredUserEmail)();
        this.authState = {
            isAuthenticated: !!accessToken,
            accessToken,
            expiresAt: null,
            userEmail: userEmail || undefined,
        };
    }
    getAuthState() {
        return { ...this.authState };
    }
    isAuthenticated() {
        return this.authState.isAuthenticated && !(0, oauth_1.isTokenExpired)();
    }
    async signIn(usePopup = true) {
        const pkceParams = await (0, oauth_1.generatePKCEParams)();
        (0, oauth_1.storePKCEParams)(pkceParams);
        const authUrl = (0, oauth_1.buildAuthorizationUrl)(this.config.clientId, this.config.redirectUri, pkceParams.codeChallenge, pkceParams.state, this.config.scopes);
        if (usePopup) {
            const popup = window.open(authUrl, 'Google Sign In', 'width=500,height=600,scrollbars=yes');
            if (!popup) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }
            return new Promise((resolve, reject) => {
                const checkPopup = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkPopup);
                        reject(new Error('Sign-in popup was closed'));
                    }
                }, 500);
                const messageHandler = async (event) => {
                    if (event.origin !== window.location.origin) {
                        return;
                    }
                    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                        clearInterval(checkPopup);
                        window.removeEventListener('message', messageHandler);
                        try {
                            await this.handleAuthCallback(event.data.url);
                            resolve();
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                };
                window.addEventListener('message', messageHandler);
            });
        }
        else {
            window.location.href = authUrl;
        }
    }
    async handleAuthCallback(callbackUrl) {
        const url = callbackUrl || window.location.href;
        const { code, state, error, error_description } = (0, oauth_1.parseCallbackUrl)(url);
        if (error) {
            throw new Error(`OAuth error: ${error_description || error}`);
        }
        if (!code || !state) {
            throw new Error('Missing authorization code or state');
        }
        const pkceParams = (0, oauth_1.retrievePKCEParams)();
        if (!pkceParams) {
            throw new Error('PKCE parameters not found. Please restart sign-in flow.');
        }
        if (!(0, oauth_1.validateState)(state, pkceParams.state)) {
            (0, oauth_1.clearPKCEParams)();
            throw new Error('Invalid state parameter. Possible CSRF attack.');
        }
        try {
            const tokenResponse = await (0, oauth_1.exchangeCodeForToken)(code, pkceParams.codeVerifier, this.config.clientId, this.config.redirectUri);
            (0, oauth_1.storeAuthTokens)(tokenResponse.access_token, tokenResponse.expires_in);
            const userEmail = await this.fetchUserEmail(tokenResponse.access_token);
            this.authState = {
                isAuthenticated: true,
                accessToken: tokenResponse.access_token,
                expiresAt: Date.now() + tokenResponse.expires_in * 1000,
                userEmail,
            };
            if (userEmail) {
                sessionStorage.setItem('gdrive_user_email', userEmail);
            }
            (0, oauth_1.clearPKCEParams)();
        }
        catch (error) {
            (0, oauth_1.clearPKCEParams)();
            throw error;
        }
    }
    async signOut() {
        if (this.authState.accessToken) {
            try {
                await (0, oauth_1.revokeToken)(this.authState.accessToken);
            }
            catch (error) {
                console.error('Failed to revoke token:', error);
            }
        }
        (0, oauth_1.clearAuthTokens)();
        this.authState = {
            isAuthenticated: false,
            accessToken: null,
            expiresAt: null,
        };
    }
    async fetchUserEmail(accessToken) {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = (await response.json());
                return data.email;
            }
        }
        catch (error) {
            console.error('Failed to fetch user email:', error);
        }
        return undefined;
    }
    async makeRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated. Please sign in first.');
        }
        const url = endpoint.startsWith('http') ? endpoint : `${types_1.DRIVE_API_BASE}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.authState.accessToken}`,
                ...options.headers,
            },
        });
        const data = (await response.json());
        if (!response.ok) {
            return {
                error: data.error,
                status: response.status,
            };
        }
        return {
            data: data,
            status: response.status,
        };
    }
    async uploadFile(file, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated. Please sign in first.');
        }
        let parentId = this.config.rootFolderId;
        if (options.parents && options.parents.length > 0) {
            parentId = options.parents[0];
        }
        else if (options.folder) {
            parentId = await this.getOrCreateFolder(options.folder);
        }
        const metadata = {
            name: options.fileName || file.name,
            mimeType: file.type,
            description: options.description,
            parents: parentId ? [parentId] : undefined,
        };
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;
        const metadataPart = delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata);
        const filePart = delimiter + `Content-Type: ${file.type}\r\n\r\n`;
        const fileData = await file.arrayBuffer();
        const multipartBody = new Blob([metadataPart, filePart, fileData, closeDelimiter]);
        const xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && options.onProgress) {
                    options.onProgress({
                        loaded: e.loaded,
                        total: e.total,
                        percentage: Math.round((e.loaded / e.total) * 100),
                    });
                }
            });
            xhr.addEventListener('load', async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    if (options.makePublic) {
                        await this.makeFilePublic(response.id);
                    }
                    resolve({
                        fileId: response.id,
                        fileName: response.name,
                        fileUrl: response.webViewLink || `https://drive.google.com/file/d/${response.id}/view`,
                        fileSize: file.size,
                        mimeType: file.type,
                        webViewLink: response.webViewLink,
                        webContentLink: response.webContentLink,
                    });
                }
                else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });
            xhr.open('POST', `${types_1.DRIVE_UPLOAD_BASE}/files?uploadType=multipart`);
            xhr.setRequestHeader('Authorization', `Bearer ${this.authState.accessToken}`);
            xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);
            xhr.send(multipartBody);
        });
    }
    async downloadFile(fileId) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated. Please sign in first.');
        }
        const response = await fetch(`${types_1.DRIVE_API_BASE}/files/${fileId}?alt=media`, {
            headers: {
                Authorization: `Bearer ${this.authState.accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }
        return response.blob();
    }
    async deleteFile(fileId) {
        const response = await this.makeRequest(`/files/${fileId}`, {
            method: 'DELETE',
        });
        if (response.error) {
            throw new Error(`Delete failed: ${response.error.message}`);
        }
    }
    async getFileMetadata(fileId) {
        const response = await this.makeRequest(`/files/${fileId}?fields=id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink`);
        if (response.error) {
            throw new Error(`Failed to get metadata: ${response.error.message}`);
        }
        return {
            id: response.data.id,
            name: response.data.name,
            size: parseInt(response.data.size || '0', 10),
            mimeType: response.data.mimeType,
            createdTime: response.data.createdTime,
            modifiedTime: response.data.modifiedTime,
            webViewLink: response.data.webViewLink,
            webContentLink: response.data.webContentLink,
            parents: response.data.parents,
            thumbnailLink: response.data.thumbnailLink,
            iconLink: response.data.iconLink,
        };
    }
    async listFiles(options = {}) {
        const params = new URLSearchParams();
        const queryParts = [];
        if (options.folderId) {
            queryParts.push(`'${options.folderId}' in parents`);
        }
        else if (this.config.rootFolderId) {
            queryParts.push(`'${this.config.rootFolderId}' in parents`);
        }
        queryParts.push('trashed = false');
        if (options.query) {
            queryParts.push(options.query);
        }
        params.append('q', queryParts.join(' and '));
        params.append('pageSize', (options.pageSize || 100).toString());
        params.append('fields', 'nextPageToken,files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink)');
        if (options.orderBy) {
            params.append('orderBy', options.orderBy);
        }
        if (options.pageToken) {
            params.append('pageToken', options.pageToken);
        }
        const response = await this.makeRequest(`/files?${params.toString()}`);
        if (response.error) {
            throw new Error(`Failed to list files: ${response.error.message}`);
        }
        return {
            files: (response.data.files || []).map((file) => ({
                id: file.id,
                name: file.name,
                size: parseInt(file.size || '0', 10),
                mimeType: file.mimeType,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                webViewLink: file.webViewLink,
                webContentLink: file.webContentLink,
                parents: file.parents,
                thumbnailLink: file.thumbnailLink,
                iconLink: file.iconLink,
            })),
            nextPageToken: response.data.nextPageToken,
            hasMore: !!response.data.nextPageToken,
        };
    }
    async searchFiles(options) {
        const queryParts = [];
        queryParts.push(`name contains '${options.query}'`);
        queryParts.push('trashed = false');
        if (options.folderId) {
            queryParts.push(`'${options.folderId}' in parents`);
        }
        if (options.mimeType) {
            queryParts.push(`mimeType = '${options.mimeType}'`);
        }
        const params = new URLSearchParams({
            q: queryParts.join(' and '),
            pageSize: (options.maxResults || 20).toString(),
            fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink)',
        });
        const response = await this.makeRequest(`/files?${params.toString()}`);
        if (response.error) {
            throw new Error(`Search failed: ${response.error.message}`);
        }
        return (response.data.files || []).map((file) => ({
            id: file.id,
            name: file.name,
            size: parseInt(file.size || '0', 10),
            mimeType: file.mimeType,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink,
            parents: file.parents,
            thumbnailLink: file.thumbnailLink,
            iconLink: file.iconLink,
        }));
    }
    async createFolder(folderName, options = {}) {
        const metadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            description: options.description,
            parents: options.parentId
                ? [options.parentId]
                : this.config.rootFolderId
                    ? [this.config.rootFolderId]
                    : undefined,
            folderColorRgb: options.folderColorRgb,
        };
        const response = await this.makeRequest('/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });
        if (response.error) {
            throw new Error(`Failed to create folder: ${response.error.message}`);
        }
        return response.data.id;
    }
    async getOrCreateFolder(folderName, parentId) {
        const queryParts = [
            `name = '${folderName}'`,
            `mimeType = 'application/vnd.google-apps.folder'`,
            'trashed = false',
        ];
        if (parentId) {
            queryParts.push(`'${parentId}' in parents`);
        }
        else if (this.config.rootFolderId) {
            queryParts.push(`'${this.config.rootFolderId}' in parents`);
        }
        const params = new URLSearchParams({
            q: queryParts.join(' and '),
            fields: 'files(id)',
            pageSize: '1',
        });
        const response = await this.makeRequest(`/files?${params.toString()}`);
        if (response.error) {
            throw new Error(`Failed to search for folder: ${response.error.message}`);
        }
        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id;
        }
        return this.createFolder(folderName, { parentId });
    }
    async makeFilePublic(fileId) {
        const permission = {
            type: 'anyone',
            role: 'reader',
        };
        const response = await this.makeRequest(`/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(permission),
        });
        if (response.error) {
            throw new Error(`Failed to make file public: ${response.error.message}`);
        }
    }
    async getStorageQuota() {
        const response = await this.makeRequest('/about?fields=storageQuota');
        if (response.error) {
            throw new Error(`Failed to get storage quota: ${response.error.message}`);
        }
        const quota = response.data.storageQuota;
        return {
            limit: parseInt(quota.limit || '0', 10),
            usage: parseInt(quota.usage || '0', 10),
            usageInDrive: parseInt(quota.usageInDrive || '0', 10),
            usageInTrash: parseInt(quota.usageInTrash || '0', 10),
        };
    }
}
exports.GoogleDriveBrowser = GoogleDriveBrowser;
