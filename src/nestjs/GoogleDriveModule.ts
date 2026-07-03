import { Module, DynamicModule, Global } from '@nestjs/common';
import { GoogleDriveService } from './GoogleDriveService';
import { GoogleDriveConfig } from '../types';

export interface GoogleDriveModuleOptions {
  /** Google Drive configuration */
  config: GoogleDriveConfig;
  /** Whether to make the module global (default: false) */
  isGlobal?: boolean;
}

/**
 * NestJS Module for Google Drive integration
 * Provides GoogleDriveService as an injectable provider
 */
@Module({})
export class GoogleDriveModule {
  /**
   * Register the Google Drive module with configuration
   * @param options - Module configuration options
   * @returns Dynamic module
   */
  static register(options: GoogleDriveModuleOptions): DynamicModule {
    const { config, isGlobal = false } = options;

    return {
      module: GoogleDriveModule,
      global: isGlobal,
      providers: [
        {
          provide: GoogleDriveService,
          useFactory: () => new GoogleDriveService(config),
        },
      ],
      exports: [GoogleDriveService],
    };
  }

  /**
   * Register the Google Drive module asynchronously
   * Useful when configuration needs to be loaded from ConfigService or other async sources
   */
  static registerAsync(options: {
    isGlobal?: boolean;
    useFactory: (...args: any[]) => Promise<GoogleDriveConfig> | GoogleDriveConfig;
    inject?: any[];
  }): DynamicModule {
    const { isGlobal = false, useFactory, inject = [] } = options;

    return {
      module: GoogleDriveModule,
      global: isGlobal,
      providers: [
        {
          provide: 'GOOGLE_DRIVE_CONFIG',
          useFactory,
          inject,
        },
        {
          provide: GoogleDriveService,
          useFactory: (config: GoogleDriveConfig) => new GoogleDriveService(config),
          inject: ['GOOGLE_DRIVE_CONFIG'],
        },
      ],
      exports: [GoogleDriveService],
    };
  }
}

