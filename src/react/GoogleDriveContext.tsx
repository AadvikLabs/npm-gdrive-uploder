/**
 * React Context for Google Drive integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleDriveBrowser } from '../browser/GoogleDriveBrowser';
import type { GoogleDriveBrowserConfig, AuthState } from '../browser/types';

/**
 * Google Drive Context type
 */
export interface GoogleDriveContextType {
  /** Google Drive client instance */
  drive: GoogleDriveBrowser | null;
  /** Current authentication state */
  authState: AuthState;
  /** Whether the client is initialized */
  isInitialized: boolean;
  /** Sign in with Google */
  signIn: (usePopup?: boolean) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Handle OAuth callback */
  handleCallback: (url?: string) => Promise<void>;
}

/**
 * Google Drive Context
 */
const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

/**
 * Props for GoogleDriveProvider
 */
export interface GoogleDriveProviderProps {
  /** Google Drive configuration */
  config: GoogleDriveBrowserConfig;
  /** Children components */
  children: ReactNode;
  /** Auto-initialize on mount */
  autoInit?: boolean;
}

/**
 * Google Drive Provider Component
 * Provides Google Drive client instance to child components
 */
export function GoogleDriveProvider({
  config,
  children,
  autoInit = true,
}: GoogleDriveProviderProps) {
  const [drive, setDrive] = useState<GoogleDriveBrowser | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    expiresAt: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Google Drive client
  useEffect(() => {
    if (autoInit && !drive) {
      const driveClient = new GoogleDriveBrowser(config);
      setDrive(driveClient);
      setAuthState(driveClient.getAuthState());
      setIsInitialized(true);
    }
  }, [config, autoInit, drive]);

  // Sign in handler
  const signIn = async (usePopup: boolean = true) => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    await drive.signIn(usePopup);
    setAuthState(drive.getAuthState());
  };

  // Sign out handler
  const signOut = async () => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    await drive.signOut();
    setAuthState(drive.getAuthState());
  };

  // Handle OAuth callback
  const handleCallback = async (url?: string) => {
    if (!drive) {
      throw new Error('Google Drive client not initialized');
    }

    await drive.handleAuthCallback(url);
    setAuthState(drive.getAuthState());
  };

  const value: GoogleDriveContextType = {
    drive,
    authState,
    isInitialized,
    signIn,
    signOut,
    handleCallback,
  };

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  );
}

/**
 * Hook to access Google Drive context
 */
export function useGoogleDriveContext(): GoogleDriveContextType {
  const context = useContext(GoogleDriveContext);
  
  if (!context) {
    throw new Error('useGoogleDriveContext must be used within GoogleDriveProvider');
  }

  return context;
}

