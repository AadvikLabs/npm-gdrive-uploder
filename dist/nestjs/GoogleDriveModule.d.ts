import { DynamicModule } from '@nestjs/common';
import { GoogleDriveConfig } from '../types';
export interface GoogleDriveModuleOptions {
    config: GoogleDriveConfig;
    isGlobal?: boolean;
}
export declare class GoogleDriveModule {
    static register(options: GoogleDriveModuleOptions): DynamicModule;
    static registerAsync(options: {
        isGlobal?: boolean;
        useFactory: (...args: any[]) => Promise<GoogleDriveConfig> | GoogleDriveConfig;
        inject?: any[];
    }): DynamicModule;
}
