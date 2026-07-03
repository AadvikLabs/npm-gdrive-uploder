"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleDriveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveService = void 0;
const common_1 = require("@nestjs/common");
const GoogleDriveStorage_1 = require("../GoogleDriveStorage");
let GoogleDriveService = GoogleDriveService_1 = class GoogleDriveService {
    constructor(config) {
        this.logger = new common_1.Logger(GoogleDriveService_1.name);
        this.driveStorage = null;
        this.config = config;
    }
    async onModuleInit() {
        try {
            this.driveStorage = new GoogleDriveStorage_1.GoogleDriveStorage(this.config);
            this.logger.log('Google Drive Service initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize Google Drive Service: ${error.message}`);
        }
    }
    isAvailable() {
        return this.driveStorage?.isAvailable() ?? false;
    }
    async uploadFile(fileBuffer, originalFileName, options) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.uploadFile(fileBuffer, originalFileName, options);
    }
    async downloadFile(fileId) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.downloadFile(fileId);
    }
    async deleteFile(fileId) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.deleteFile(fileId);
    }
    async getFileMetadata(fileId) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.getFileMetadata(fileId);
    }
    async listFiles(options) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.listFiles(options);
    }
    async createFolder(folderName, parentFolderId) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.createFolder(folderName, parentFolderId);
    }
    async getOrCreateFolder(folderName, parentFolderId) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.getOrCreateFolder(folderName, parentFolderId);
    }
    async searchFiles(options) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.searchFiles(options);
    }
    async makeFilePublic(fileId, isSharedDrive) {
        if (!this.driveStorage) {
            throw new Error('Google Drive Service is not initialized');
        }
        return this.driveStorage.makeFilePublic(fileId, isSharedDrive);
    }
};
exports.GoogleDriveService = GoogleDriveService;
exports.GoogleDriveService = GoogleDriveService = GoogleDriveService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], GoogleDriveService);
