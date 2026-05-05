import React from 'react';
import type { BrowserUploadOptions } from '../../browser/types';
export interface FileUploaderProps {
    uploadOptions?: Omit<BrowserUploadOptions, 'onProgress'>;
    onUploadComplete?: (fileId: string, fileName: string) => void;
    onUploadError?: (error: Error) => void;
    accept?: string;
    multiple?: boolean;
    className?: string;
    style?: React.CSSProperties;
    showProgress?: boolean;
    buttonText?: string;
    disableDragDrop?: boolean;
}
export declare function FileUploader({ uploadOptions, onUploadComplete, onUploadError, accept, multiple, className, style, showProgress, buttonText, disableDragDrop, }: FileUploaderProps): React.JSX.Element;
