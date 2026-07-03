/**
 * Browser-compatible Google Drive client
 * Uses OAuth2 PKCE flow for secure authentication in Single Page Applications
 */

import {
  GoogleDriveBrowserConfig,
  AuthState,
  BrowserUploadOptions,
  BrowserUploadResult,
  BrowserFileMetadata,
  BrowserListOptions,
  BrowserListResponse,
  BrowserSearchOptions,
  CreateFolderOptions,
  DriveAPIResponse,
  DRIVE_API_BASE,
  DRIVE_UPLOAD_BASE,
  DEFAULT_SCOPES,
} from './types';

import {
  generatePKCEParams,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  revokeToken,
  storePKCEParams,
  retrievePKCEParams,
  clearPKCEParams,
  storeAuthTokens,
  getStoredAccessToken,
  getStoredUserEmail,
  clearAuthTokens,
  parseCallbackUrl,
  validateState,
  isTokenExpired,
} from './oauth';

/**
 * Google Drive Browser Client
 * Provides file upload, download, and management functionality for browser environments
 */
export class GoogleDriveBrowser {
  private config: GoogleDriveBrowserConfig;
  private authState: AuthState;

  /**
   * Create a new GoogleDriveBrowser instance
   * @param config - Browser configuration options
   */
  constructor(config: GoogleDriveBrowserConfig) {
    this.config = {
      ...config,
      scopes: config.scopes || DEFAULT_SCOPES,
      redirectUri: config.redirectUri || window.location.origin,
    };

    // Initialize auth state from storage
    const accessToken = getStoredAccessToken();
    const userEmail = getStoredUserEmail();

    this.authState = {
      isAuthenticated: !!accessToken,
      accessToken,
      expiresAt: null,
      userEmail: userEmail || undefined,
    };
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !isTokenExpired();
  }

  /**
   * Initiate OAuth2 sign-in flow
   * Opens Google OAuth consent screen in a popup or redirects
   */
  public async signIn(usePopup: boolean = true): Promise<void> {
    // Generate PKCE parameters
    const pkceParams = await generatePKCEParams();

    // Store PKCE params for later verification
    storePKCEParams(pkceParams);

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(
      this.config.clientId,
      this.config.redirectUri!,
      pkceParams.codeChallenge,
      pkceParams.state,
      this.config.scopes,
    );

    if (usePopup) {
      // Open in popup window
      const popup = window.open(authUrl, 'Google Sign In', 'width=500,height=600,scrollbars=yes');

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for popup to close or receive message
      return new Promise((resolve, reject) => {
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            reject(new Error('Sign-in popup was closed'));
          }
        }, 500);

        // Listen for message from popup
        const messageHandler = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);

            try {
              await this.handleAuthCallback(event.data.url);
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        };

        window.addEventListener('message', messageHandler);
      });
    } else {
      // Redirect to Google OAuth
      window.location.href = authUrl;
    }
  }

  /**
   * Handle OAuth2 callback
   * Call this method on your redirect URI page
   */
  public async handleAuthCallback(callbackUrl?: string): Promise<void> {
    const url = callbackUrl || window.location.href;
    const { code, state, error, error_description } = parseCallbackUrl(url);

    if (error) {
      throw new Error(`OAuth error: ${error_description || error}`);
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Retrieve stored PKCE params
    const pkceParams = retrievePKCEParams();
    if (!pkceParams) {
      throw new Error('PKCE parameters not found. Please restart sign-in flow.');
    }

    // Validate state to prevent CSRF
    if (!validateState(state, pkceParams.state)) {
      clearPKCEParams();
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    try {
      // Exchange code for token
      const tokenResponse = await exchangeCodeForToken(
        code,
        pkceParams.codeVerifier,
        this.config.clientId,
        this.config.redirectUri!,
      );

      // Store tokens
      storeAuthTokens(tokenResponse.access_token, tokenResponse.expires_in);

      // Fetch user info
      const userEmail = await this.fetchUserEmail(tokenResponse.access_token);

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        accessToken: tokenResponse.access_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        userEmail,
      };

      // Store user email
      if (userEmail) {
        sessionStorage.setItem('gdrive_user_email', userEmail);
      }

      // Clear PKCE params
      clearPKCEParams();
    } catch (error) {
      clearPKCEParams();
      throw error;
    }
  }

  /**
   * Sign out and revoke access
   */
  public async signOut(): Promise<void> {
    if (this.authState.accessToken) {
      try {
        await revokeToken(this.authState.accessToken);
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }
    }

    clearAuthTokens();
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      expiresAt: null,
    };
  }

  /**
   * Fetch user email from Google
   */
  private async fetchUserEmail(accessToken: string): Promise<string | undefined> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { email?: string };
        return data.email;
      }
    } catch (error) {
      console.error('Failed to fetch user email:', error);
    }

    return undefined;
  }

  /**
   * Make authenticated API request to Google Drive
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<DriveAPIResponse<T>> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${DRIVE_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.authState.accessToken}`,
        ...options.headers,
      },
    });

    const data = (await response.json()) as T | { error: any };

    if (!response.ok) {
      return {
        error: (data as { error: any }).error,
        status: response.status,
      };
    }

    return {
      data: data as T,
      status: response.status,
    };
  }

  /**
   * Upload a file to Google Drive
   */
  public async uploadFile(
    file: File,
    options: BrowserUploadOptions = {},
  ): Promise<BrowserUploadResult> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    // Determine parent folder
    let parentId = this.config.rootFolderId;

    if (options.parents && options.parents.length > 0) {
      parentId = options.parents[0];
    } else if (options.folder) {
      parentId = await this.getOrCreateFolder(options.folder);
    }

    // Prepare metadata
    const metadata = {
      name: options.fileName || file.name,
      mimeType: file.type,
      description: options.description,
      parents: parentId ? [parentId] : undefined,
    };

    // Create multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const filePart = delimiter + `Content-Type: ${file.type}\r\n\r\n`;

    // Read file as array buffer
    const fileData = await file.arrayBuffer();

    // Combine parts
    const multipartBody = new Blob([metadataPart, filePart, fileData, closeDelimiter]);

    // Upload with progress tracking
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

          // Make file public if requested
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
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.authState.accessToken}`);
      xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);
      xhr.send(multipartBody);
    });
  }

  /**
   * Download a file from Google Drive
   */
  public async downloadFile(fileId: string): Promise<Blob> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.authState.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Delete a file from Google Drive
   */
  public async deleteFile(fileId: string): Promise<void> {
    const response = await this.makeRequest(`/files/${fileId}`, {
      method: 'DELETE',
    });

    if (response.error) {
      throw new Error(`Delete failed: ${response.error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(fileId: string): Promise<BrowserFileMetadata> {
    const response = await this.makeRequest<any>(
      `/files/${fileId}?fields=id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink`,
    );

    if (response.error) {
      throw new Error(`Failed to get metadata: ${response.error.message}`);
    }

    return {
      id: response.data!.id,
      name: response.data!.name,
      size: parseInt(response.data!.size || '0', 10),
      mimeType: response.data!.mimeType,
      createdTime: response.data!.createdTime,
      modifiedTime: response.data!.modifiedTime,
      webViewLink: response.data!.webViewLink,
      webContentLink: response.data!.webContentLink,
      parents: response.data!.parents,
      thumbnailLink: response.data!.thumbnailLink,
      iconLink: response.data!.iconLink,
    };
  }

  /**
   * List files in a folder
   */
  public async listFiles(options: BrowserListOptions = {}): Promise<BrowserListResponse> {
    const params = new URLSearchParams();

    // Build query
    const queryParts: string[] = [];

    if (options.folderId) {
      queryParts.push(`'${options.folderId}' in parents`);
    } else if (this.config.rootFolderId) {
      queryParts.push(`'${this.config.rootFolderId}' in parents`);
    }

    queryParts.push('trashed = false');

    if (options.query) {
      queryParts.push(options.query);
    }

    params.append('q', queryParts.join(' and '));
    params.append('pageSize', (options.pageSize || 100).toString());
    params.append(
      'fields',
      'nextPageToken,files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink)',
    );

    if (options.orderBy) {
      params.append('orderBy', options.orderBy);
    }

    if (options.pageToken) {
      params.append('pageToken', options.pageToken);
    }

    const response = await this.makeRequest<any>(`/files?${params.toString()}`);

    if (response.error) {
      throw new Error(`Failed to list files: ${response.error.message}`);
    }

    return {
      files: (response.data!.files || []).map((file: any) => ({
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
      nextPageToken: response.data!.nextPageToken,
      hasMore: !!response.data!.nextPageToken,
    };
  }

  /**
   * Search for files
   */
  public async searchFiles(options: BrowserSearchOptions): Promise<BrowserFileMetadata[]> {
    const queryParts: string[] = [];

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
      fields:
        'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink)',
    });

    const response = await this.makeRequest<any>(`/files?${params.toString()}`);

    if (response.error) {
      throw new Error(`Search failed: ${response.error.message}`);
    }

    return (response.data!.files || []).map((file: any) => ({
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

  /**
   * Create a folder
   */
  public async createFolder(
    folderName: string,
    options: CreateFolderOptions = {},
  ): Promise<string> {
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

    const response = await this.makeRequest<any>('/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (response.error) {
      throw new Error(`Failed to create folder: ${response.error.message}`);
    }

    return response.data!.id;
  }

  /**
   * Get or create a folder
   */
  public async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
    // Search for existing folder
    const queryParts: string[] = [
      `name = '${folderName}'`,
      `mimeType = 'application/vnd.google-apps.folder'`,
      'trashed = false',
    ];

    if (parentId) {
      queryParts.push(`'${parentId}' in parents`);
    } else if (this.config.rootFolderId) {
      queryParts.push(`'${this.config.rootFolderId}' in parents`);
    }

    const params = new URLSearchParams({
      q: queryParts.join(' and '),
      fields: 'files(id)',
      pageSize: '1',
    });

    const response = await this.makeRequest<any>(`/files?${params.toString()}`);

    if (response.error) {
      throw new Error(`Failed to search for folder: ${response.error.message}`);
    }

    // Return existing folder if found
    if (response.data!.files && response.data!.files.length > 0) {
      return response.data!.files[0].id;
    }

    // Create new folder
    return this.createFolder(folderName, { parentId });
  }

  /**
   * Make a file publicly accessible
   */
  public async makeFilePublic(fileId: string): Promise<void> {
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

  /**
   * Get user's Drive storage quota
   */
  public async getStorageQuota(): Promise<{
    limit: number;
    usage: number;
    usageInDrive: number;
    usageInTrash: number;
  }> {
    const response = await this.makeRequest<any>('/about?fields=storageQuota');

    if (response.error) {
      throw new Error(`Failed to get storage quota: ${response.error.message}`);
    }

    const quota = response.data!.storageQuota;
    return {
      limit: parseInt(quota.limit || '0', 10),
      usage: parseInt(quota.usage || '0', 10),
      usageInDrive: parseInt(quota.usageInDrive || '0', 10),
      usageInTrash: parseInt(quota.usageInTrash || '0', 10),
    };
  }
}
