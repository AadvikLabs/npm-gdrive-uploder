import React, { ReactNode } from 'react';
import { GoogleDriveBrowser } from '../browser/GoogleDriveBrowser';
import type { GoogleDriveBrowserConfig, AuthState } from '../browser/types';
export interface GoogleDriveContextType {
    drive: GoogleDriveBrowser | null;
    authState: AuthState;
    isInitialized: boolean;
    signIn: (usePopup?: boolean) => Promise<void>;
    signOut: () => Promise<void>;
    handleCallback: (url?: string) => Promise<void>;
}
export interface GoogleDriveProviderProps {
    config: GoogleDriveBrowserConfig;
    children: ReactNode;
    autoInit?: boolean;
}
export declare function GoogleDriveProvider({ config, children, autoInit, }: GoogleDriveProviderProps): React.JSX.Element;
export declare function useGoogleDriveContext(): GoogleDriveContextType;
