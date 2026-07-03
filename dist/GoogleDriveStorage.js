"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveStorage = void 0;
const googleapis_1 = require("googleapis");
const stream = __importStar(require("stream"));
const content_type_1 = require("./utils/content-type");
class GoogleDriveStorage {
    constructor(config) {
        this.isInitialized = false;
        this.config = config;
        this.initializeGoogleDrive();
    }
    async initializeGoogleDrive() {
        try {
            const { clientId, clientSecret, refreshToken, rootFolderId, redirectUri, } = this.config;
            if (!clientId || !clientSecret || !refreshToken) {
                throw new Error('Missing required Google Drive credentials');
            }
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri || 'urn:ietf:wg:oauth:2.0:oob');
            oauth2Client.setCredentials({
                refresh_token: refreshToken,
            });
            this.drive = googleapis_1.google.drive({ version: 'v3', auth: oauth2Client });
            this.rootFolderId = rootFolderId;
            this.isInitialized = true;
            await this.testConnection();
        }
        catch (error) {
            this.isInitialized = false;
            throw new Error(`Failed to initialize Google Drive: ${error.message}`);
        }
    }
    async testConnection() {
        try {
            await this.drive.about.get({ fields: 'user' });
        }
        catch (error) {
            this.isInitialized = false;
            throw new Error(`Google Drive connection test failed: ${error.message}`);
        }
    }
    isAvailable() {
        return this.isInitialized;
    }
    async uploadFile(fileBuffer, originalFileName, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Google Drive Storage is not initialized');
        }
        try {
            const { folder = 'uploads', fileName = (0, content_type_1.generateFileName)(originalFileName), makePublic = false, description = `Uploaded - ${new Date().toISOString()}`, parents = [], } = options;
            let finalParents = parents;
            if (finalParents.length === 0) {
                const folderId = await this.getOrCreateFolder(folder);
                finalParents = [folderId];
            }
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);
            const fileMetadata = {
                name: fileName,
                description,
                parents: finalParents,
            };
            const media = {
                mimeType: (0, content_type_1.getContentType)(originalFileName),
                body: bufferStream,
            };
            const isSharedDrive = await this.isSharedDriveFolder(finalParents[0]);
            const uploadParams = {
                requestBody: fileMetadata,
                media: media,
                fields: 'id,name,size,mimeType,webViewLink,webContentLink,parents',
            };
            if (isSharedDrive) {
                uploadParams.supportsAllDrives = true;
            }
            const response = await this.drive.files.create(uploadParams);
            const file = response.data;
            if (makePublic) {
                await this.makeFilePublic(file.id, isSharedDrive);
            }
            const result = {
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
        }
        catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }
    async downloadFile(fileId) {
        if (!this.isInitialized) {
            throw new Error('Google Drive Storage is not initialized');
        }
        try {
            const isSharedDrive = await this.isFileInSharedDrive(fileId);
            const downloadParams = {
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
                const chunks = [];
                response.data.on('data', (chunk) => chunks.push(chunk));
                response.data.on('end', () => resolve(Buffer.concat(chunks)));
                response.data.on('error', reject);
            });
        }
        catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }
    async deleteFile(fileId) {
        if (!this.isInitialized) {
            throw new Error('Google Drive Storage is not initialized');
        }
        try {
            const isSharedDrive = await this.isFileInSharedDrive(fileId);
            const deleteParams = { fileId };
            if (isSharedDrive) {
                deleteParams.supportsAllDrives = true;
            }
            await this.drive.files.delete(deleteParams);
        }
        catch (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
    }
    async getFileMetadata(fileId) {
        if (!this.isInitialized) {
            throw new Error('Google Drive Storage is not initialized');
        }
        try {
            const isSharedDrive = await this.isFileInSharedDrive(fileId);
            const metadataParams = {
                fileId,
                fields: 'id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents',
            };
            if (isSharedDrive) {
                metadataParams.supportsAllDrives = true;
            }
            const response = await this.drive.files.get(metadataParams);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get metadata failed: ${error.message}`);
        }
    }
    async listFiles(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Google Drive Storage is not initialized');
        }
        try {
            const { folderId, pageSize = 100, orderBy = 'modifiedTime desc', query, } = options;
            const searchQuery = query ||
                (folderId
                    ? `'${folderId}' in parents and trashed=false`
                    : 'trashed=false');
            const isSharedDrive = folderId
                ? await this.isSharedDriveFolder(folderId)
                : false;
            const listParams = {
                q: searchQuery,
                pageSize,
                fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents)',
                orderBy,
            };
            if (isSharedDrive) {
                listParams.supportsAllDrives = true;
                listParams.includeItemsFromAllDrives = true;
            }
            const response = await this.drive.files.list(listParams);
            return response.data.files || [];
        }
        catch (error) {
            throw new Error(`List files failed: ${error.message}`);
        }
    }
    async createFolder(folderName, parentFolderId) {
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
            const createParams = {
                requestBody: fileMetadata,
                fields: 'id',
            };
            if (isSharedDrive) {
                createParams.supportsAllDrives = true;
            }
            const response = await this.drive.files.create(createParams);
            return response.data.id;
        }
        catch (error) {
            throw new Error(`Create folder failed: ${error.message}`);
        }
    }
    async getOrCreateFolder(folderName, parentFolderId) {
        try {
            const parent = parentFolderId || this.rootFolderId;
            const query = parent
                ? `name='${folderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
                : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const isSharedDrive = parent
                ? await this.isSharedDriveFolder(parent)
                : false;
            const listParams = {
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
            return await this.createFolder(folderName, parentFolderId);
        }
        catch (error) {
            throw new Error(`Get or create folder failed: ${error.message}`);
        }
    }
    async searchFiles(options) {
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
                fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,parents)',
                orderBy: 'modifiedTime desc',
            });
            return response.data.files || [];
        }
        catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }
    async makeFilePublic(fileId, isSharedDrive = false) {
        try {
            const permissionParams = {
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
        }
        catch (error) {
            throw new Error(`Make public failed: ${error.message}`);
        }
    }
    async isSharedDriveFolder(folderId) {
        try {
            const response = await this.drive.files.get({
                fileId: folderId,
                fields: 'driveId',
                supportsAllDrives: true,
            });
            return !!response.data.driveId;
        }
        catch (error) {
            return false;
        }
    }
    async isFileInSharedDrive(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'driveId',
                supportsAllDrives: true,
            });
            return !!response.data.driveId;
        }
        catch (error) {
            return false;
        }
    }
}
exports.GoogleDriveStorage = GoogleDriveStorage;
