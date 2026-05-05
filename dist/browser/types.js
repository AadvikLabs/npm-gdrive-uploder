"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = exports.OAUTH2_REVOKE_URL = exports.OAUTH2_TOKEN_URL = exports.OAUTH2_AUTH_URL = exports.DRIVE_UPLOAD_BASE = exports.DRIVE_API_BASE = exports.DEFAULT_SCOPES = void 0;
exports.DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
];
exports.DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
exports.DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
exports.OAUTH2_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
exports.OAUTH2_TOKEN_URL = 'https://oauth2.googleapis.com/token';
exports.OAUTH2_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
exports.STORAGE_KEYS = {
    ACCESS_TOKEN: 'gdrive_access_token',
    EXPIRES_AT: 'gdrive_expires_at',
    USER_EMAIL: 'gdrive_user_email',
    CODE_VERIFIER: 'gdrive_code_verifier',
    STATE: 'gdrive_state',
};
