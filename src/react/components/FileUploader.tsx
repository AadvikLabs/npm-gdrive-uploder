/**
 * Pre-built File Uploader component for React
 */

import React, { useRef, useState, ChangeEvent, DragEvent } from 'react';
import { useFileUpload } from '../hooks';
import type { BrowserUploadOptions } from '../../browser/types';

/**
 * Props for FileUploader component
 */
export interface FileUploaderProps {
  /** Upload options */
  uploadOptions?: Omit<BrowserUploadOptions, 'onProgress'>;
  /** Callback when upload completes */
  onUploadComplete?: (fileId: string, fileName: string) => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
  /** Accept file types (e.g., 'image/*', '.pdf') */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Show progress bar */
  showProgress?: boolean;
  /** Custom upload button text */
  buttonText?: string;
  /** Disable drag and drop */
  disableDragDrop?: boolean;
}

/**
 * File Uploader Component
 * Provides a complete file upload UI with drag-and-drop support
 */
export function FileUploader({
  uploadOptions,
  onUploadComplete,
  onUploadError,
  accept,
  multiple = false,
  className = '',
  style,
  showProgress = true,
  buttonText = 'Choose File',
  disableDragDrop = false,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFile, isUploading, progress, error, result, reset } = useFileUpload();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0]; // Handle first file for now

    try {
      const uploadResult = await uploadFile(file, uploadOptions);
      onUploadComplete?.(uploadResult.fileId, uploadResult.fileName);
    } catch (err) {
      onUploadError?.(err as Error);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (disableDragDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (disableDragDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disableDragDrop) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (disableDragDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    handleFileSelect(e.dataTransfer.files);
  };

  const containerStyle: React.CSSProperties = {
    border: `2px dashed ${isDragging ? '#4285f4' : '#ccc'}`,
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: isDragging ? '#f0f7ff' : '#fafafa',
    transition: 'all 0.3s ease',
    cursor: disableDragDrop ? 'default' : 'pointer',
    ...style,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: isUploading ? 'not-allowed' : 'pointer',
    opacity: isUploading ? 0.6 : 1,
    transition: 'all 0.2s ease',
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '16px',
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#4285f4',
    width: `${progress?.percentage || 0}%`,
    transition: 'width 0.3s ease',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {!isUploading && !result && (
        <>
          <div style={{ marginBottom: '16px' }}>
            {!disableDragDrop && (
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                Drag and drop a file here, or
              </p>
            )}
            <button
              onClick={handleButtonClick}
              style={buttonStyle}
              disabled={isUploading}
            >
              {buttonText}
            </button>
          </div>
        </>
      )}

      {isUploading && (
        <div>
          <p style={{ margin: '0 0 8px 0', color: '#666' }}>
            Uploading...
          </p>
          {showProgress && progress && (
            <>
              <div style={progressBarStyle}>
                <div style={progressFillStyle} />
              </div>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                {progress.percentage}% ({Math.round(progress.loaded / 1024)} KB / {Math.round(progress.total / 1024)} KB)
              </p>
            </>
          )}
        </div>
      )}

      {result && (
        <div style={{ color: '#0f9d58' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
            ✓ Upload Complete!
          </p>
          <p style={{ margin: '0', fontSize: '14px' }}>
            {result.fileName}
          </p>
          <button
            onClick={reset}
            style={{
              ...buttonStyle,
              backgroundColor: '#666',
              marginTop: '16px',
            }}
          >
            Upload Another File
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: '#d93025', marginTop: '16px' }}>
          <p style={{ margin: '0', fontWeight: 'bold' }}>
            ✗ Upload Failed
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
            {error.message}
          </p>
          <button
            onClick={reset}
            style={{
              ...buttonStyle,
              backgroundColor: '#d93025',
              marginTop: '16px',
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

