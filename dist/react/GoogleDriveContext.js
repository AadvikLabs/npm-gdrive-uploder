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
exports.GoogleDriveProvider = GoogleDriveProvider;
exports.useGoogleDriveContext = useGoogleDriveContext;
const react_1 = __importStar(require("react"));
const GoogleDriveBrowser_1 = require("../browser/GoogleDriveBrowser");
const GoogleDriveContext = (0, react_1.createContext)(undefined);
function GoogleDriveProvider({ config, children, autoInit = true, }) {
    const [drive, setDrive] = (0, react_1.useState)(null);
    const [authState, setAuthState] = (0, react_1.useState)({
        isAuthenticated: false,
        accessToken: null,
        expiresAt: null,
    });
    const [isInitialized, setIsInitialized] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (autoInit && !drive) {
            const driveClient = new GoogleDriveBrowser_1.GoogleDriveBrowser(config);
            setDrive(driveClient);
            setAuthState(driveClient.getAuthState());
            setIsInitialized(true);
        }
    }, [config, autoInit, drive]);
    const signIn = async (usePopup = true) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        await drive.signIn(usePopup);
        setAuthState(drive.getAuthState());
    };
    const signOut = async () => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        await drive.signOut();
        setAuthState(drive.getAuthState());
    };
    const handleCallback = async (url) => {
        if (!drive) {
            throw new Error('Google Drive client not initialized');
        }
        await drive.handleAuthCallback(url);
        setAuthState(drive.getAuthState());
    };
    const value = {
        drive,
        authState,
        isInitialized,
        signIn,
        signOut,
        handleCallback,
    };
    return (react_1.default.createElement(GoogleDriveContext.Provider, { value: value }, children));
}
function useGoogleDriveContext() {
    const context = (0, react_1.useContext)(GoogleDriveContext);
    if (!context) {
        throw new Error('useGoogleDriveContext must be used within GoogleDriveProvider');
    }
    return context;
}
