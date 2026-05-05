# @aadviklabs/gdrive-uploader

A comprehensive, production-ready Google Drive file upload and management library for **Node.js**, **NestJS**, **React**, and **Next.js** applications.

## Features

✨ **Easy to Use** - Simple API with TypeScript support
📦 **Multi-Platform** - Works in Node.js backend, React, and Next.js
🌐 **Browser Support** - Client-side Google Drive integration with OAuth2 PKCE
🔒 **Secure** - OAuth2 authentication (server-side with refresh tokens, client-side with PKCE)
📁 **Folder Management** - Create, organize, and manage folders
🔍 **Search & List** - Search files and list folder contents
� **React Hooks** - Pre-built hooks for easy React integration
🧩 **NestJS Module** - Injectable service for NestJS applications
🔗 **Public/Private Files** - Control file visibility
⚡ **TypeScript First** - Written in TypeScript with full type definitions
🎯 **Production Ready** - Battle-tested in production environments

## Installation

```bash
npm install @aadviklabs/gdrive-uploader
```

For React/Next.js projects, also install peer dependencies:

```bash
npm install react react-dom
```

## Table of Contents

- [Node.js / Backend Usage](#nodejs--backend-usage)
- [React Usage](#react-usage)
- [Next.js Usage](#nextjs-usage)
- [Browser Usage](#browser-usage)
- [NestJS Usage](#nestjs-usage)
- [Google OAuth Setup](#google-oauth-setup)
- [Security Best Practices](#security-best-practices)
- [API Reference](#api-reference)

---

## Node.js / Backend Usage

### Quick Start

```typescript
import { GoogleDriveStorage } from '@aadviklabs/gdrive-uploader';

const driveStorage = new GoogleDriveStorage({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
});

// Upload a file
const result = await driveStorage.uploadFile(fileBuffer, 'hello.txt', {
  folder: 'my-uploads',
});

console.log('File uploaded:', result.fileId);
```

### Available Methods

```typescript
// Upload file
await driveStorage.uploadFile(buffer, 'file.pdf', { folder: 'Documents' });

// Download file
const buffer = await driveStorage.downloadFile(fileId);

// List files
const files = await driveStorage.listFiles({ folderId: 'folder-id' });

// Search files
const results = await driveStorage.searchFiles({ query: 'report' });

// Delete file
await driveStorage.deleteFile(fileId);

// Create folder
const folderId = await driveStorage.createFolder('My Folder');
```

---

## React Usage

### 1. Setup Provider

Wrap your app with `GoogleDriveProvider`:

```tsx
import { GoogleDriveProvider } from '@aadviklabs/gdrive-uploader/react';

function App() {
  return (
    <GoogleDriveProvider
      config={{
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        redirectUri: window.location.origin + '/auth/callback',
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
      }}
    >
      <YourApp />
    </GoogleDriveProvider>
  );
}
```

### 2. Use Authentication Hook

```tsx
import { useGoogleAuth } from '@aadviklabs/gdrive-uploader/react';

function AuthButton() {
  const { isAuthenticated, userEmail, signIn, signOut } = useGoogleAuth();

  if (isAuthenticated) {
    return (
      <div>
        <span>Signed in as: {userEmail}</span>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn(true)}>Sign in with Google</button>;
}
```

### 3. Upload Files

```tsx
import { FileUploader } from '@aadviklabs/gdrive-uploader/react';

function UploadPage() {
  return (
    <FileUploader
      uploadOptions={{
        folder: 'My Uploads',
        makePublic: false,
      }}
      onUploadComplete={(fileId, fileName) => {
        console.log('Uploaded:', fileName);
      }}
      showProgress={true}
    />
  );
}
```

### 4. List and Manage Files

```tsx
import { useFileList, useFileDelete } from '@aadviklabs/gdrive-uploader/react';

function FileList() {
  const { files, isLoading, loadFiles, refresh } = useFileList();
  const { deleteFile } = useFileDelete();

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div>
      {files.map((file) => (
        <div key={file.id}>
          <span>{file.name}</span>
          <button onClick={() => deleteFile(file.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Available React Hooks

- `useGoogleAuth()` - Authentication state and methods
- `useFileUpload()` - File upload with progress tracking
- `useFileDownload()` - Download files
- `useFileList()` - List files with pagination
- `useFileSearch()` - Search files
- `useFileDelete()` - Delete files
- `useFolderOperations()` - Create and manage folders

---

## Next.js Usage

### App Router (Next.js 13+)

#### 1. Create Layout with Provider

```tsx
// app/layout.tsx
'use client';

import { GoogleDriveProvider } from '@aadviklabs/gdrive-uploader/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleDriveProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
          }}
        >
          {children}
        </GoogleDriveProvider>
      </body>
    </html>
  );
}
```

#### 2. Create OAuth Callback Page

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleDriveContext } from '@aadviklabs/gdrive-uploader/react';

export default function CallbackPage() {
  const router = useRouter();
  const { handleCallback } = useGoogleDriveContext();

  useEffect(() => {
    handleCallback().then(() => router.push('/'));
  }, []);

  return <div>Processing authentication...</div>;
}
```

### Pages Router

See [examples/nextjs/pages-router-example.tsx](examples/nextjs/pages-router-example.tsx) for complete example.

### Server-Side API Routes

Create API routes for server-side operations:

```typescript
// pages/api/drive/upload.ts
import { GoogleDriveStorage } from '@aadviklabs/gdrive-uploader';

export default async function handler(req, res) {
  const drive = new GoogleDriveStorage({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
  });

  const result = await drive.uploadFile(fileBuffer, fileName);
  res.json(result);
}
```

---

## Browser Usage

For vanilla JavaScript or other frameworks:

```typescript
import { GoogleDriveBrowser } from '@aadviklabs/gdrive-uploader/browser';

const drive = new GoogleDriveBrowser({
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: window.location.origin + '/callback',
});

// Sign in
await drive.signIn(true); // true = use popup

// Upload file
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const result = await drive.uploadFile(file, {
  folder: 'Uploads',
});

console.log('Uploaded:', result.fileId);
```

---

## NestJS Usage

### 1. Import Module

```typescript
import { GoogleDriveModule } from '@aadviklabs/gdrive-uploader';

@Module({
  imports: [
    GoogleDriveModule.register({
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
      },
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### 2. Inject Service

```typescript
import { GoogleDriveService } from '@aadviklabs/gdrive-uploader';

@Injectable()
export class FileService {
  constructor(private readonly driveService: GoogleDriveService) {}

  async uploadFile(file: Express.Multer.File) {
    return this.driveService.uploadFile(file.buffer, file.originalname, {
      folder: 'uploads',
    });
  }
}
```

---

## Google OAuth Setup

### For Backend (Node.js/NestJS)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Drive API**
4. Create **OAuth 2.0 Client ID** credentials
5. Add authorized redirect URIs (e.g., `http://localhost:3000/oauth2callback`)
6. Get your **Client ID**, **Client Secret**, and **Refresh Token**

#### Getting Refresh Token

Use the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/):

1. Click settings (⚙️) and check "Use your own OAuth credentials"
2. Enter your Client ID and Client Secret
3. Select scopes: `https://www.googleapis.com/auth/drive.file`
4. Click "Authorize APIs"
5. Exchange authorization code for tokens
6. Copy the **Refresh Token**

### For Frontend (React/Next.js/Browser)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create **OAuth 2.0 Client ID** for **Web application**
3. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
5. Copy your **Client ID** (⚠️ **DO NOT** use Client Secret in frontend!)

### Environment Variables

Create a `.env` file:

```bash
# Backend (Node.js/NestJS)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_ROOT_FOLDER_ID=optional-folder-id

# Frontend (React/Next.js)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
```

---

## Security Best Practices

### ✅ DO

- **Backend**: Use Client Secret and Refresh Token (server-side only)
- **Frontend**: Use OAuth2 PKCE flow (no client secret required)
- Store tokens in `sessionStorage` (not `localStorage` for better security)
- Use environment variables for sensitive credentials
- Limit OAuth scopes to minimum required:
  - `https://www.googleapis.com/auth/drive.file` - Access only files created by the app
  - `https://www.googleapis.com/auth/drive` - Full Drive access (use cautiously)
- Validate file types and sizes before upload
- Use HTTPS in production
- Implement rate limiting on API routes

### ❌ DON'T

- **Never** expose Client Secret in frontend code
- **Never** commit credentials to version control
- **Never** use Refresh Tokens in browser/frontend
- **Never** store sensitive tokens in `localStorage` (vulnerable to XSS)
- **Never** grant more OAuth scopes than necessary

### Architecture Recommendations

#### Option 1: Client-Side Only (Simple)

- Use `@aadviklabs/gdrive-uploader/browser` or `/react`
- User authenticates with their own Google account
- Files are uploaded directly from browser to Google Drive
- ✅ Simple, no backend needed
- ❌ User must sign in with Google
- ❌ Limited control over file organization

#### Option 2: Server-Side Proxy (Recommended for Production)

- Frontend sends files to your API
- Backend uses service account or OAuth to upload to Drive
- ✅ Full control over file organization
- ✅ Can implement additional validation/processing
- ✅ Users don't need Google accounts
- ❌ Requires backend infrastructure

#### Option 3: Hybrid (Best of Both)

- Use client-side for user-specific files
- Use server-side for shared/organizational files
- ✅ Maximum flexibility
- ❌ More complex setup

---

## API Reference

### Node.js / Backend

#### `GoogleDriveStorage`

```typescript
class GoogleDriveStorage {
  constructor(config: GoogleDriveConfig);

  uploadFile(buffer: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult>;
  downloadFile(fileId: string): Promise<Buffer>;
  deleteFile(fileId: string): Promise<void>;
  getFileMetadata(fileId: string): Promise<FileMetadata>;
  listFiles(options?: ListOptions): Promise<FileMetadata[]>;
  searchFiles(options: SearchOptions): Promise<FileMetadata[]>;
  createFolder(folderName: string, parentId?: string): Promise<string>;
  getOrCreateFolder(folderName: string, parentId?: string): Promise<string>;
  makeFilePublic(fileId: string): Promise<void>;
}
```

### Browser

#### `GoogleDriveBrowser`

```typescript
class GoogleDriveBrowser {
  constructor(config: GoogleDriveBrowserConfig);

  signIn(usePopup?: boolean): Promise<void>;
  signOut(): Promise<void>;
  handleAuthCallback(url?: string): Promise<void>;
  isAuthenticated(): boolean;

  uploadFile(file: File, options?: BrowserUploadOptions): Promise<BrowserUploadResult>;
  downloadFile(fileId: string): Promise<Blob>;
  deleteFile(fileId: string): Promise<void>;
  getFileMetadata(fileId: string): Promise<BrowserFileMetadata>;
  listFiles(options?: BrowserListOptions): Promise<BrowserListResponse>;
  searchFiles(options: BrowserSearchOptions): Promise<BrowserFileMetadata[]>;
  createFolder(folderName: string, options?: CreateFolderOptions): Promise<string>;
  getStorageQuota(): Promise<StorageQuota>;
}
```

### React Hooks

See [React Usage](#react-usage) section for hook documentation.

---

## Examples

- [Node.js Standalone](examples/standalone-example.ts)
- [NestJS Integration](examples/nestjs-example.ts)
- [React Complete App](examples/react/complete-example.tsx)
- [Next.js App Router](examples/nextjs/app-router-example.tsx)
- [Next.js Pages Router](examples/nextjs/pages-router-example.tsx)
- [Next.js API Routes](examples/nextjs/api-route-example.ts)

---

## Troubleshooting

### "Not authenticated" error in browser

Make sure you've called `signIn()` before attempting file operations.

### "Invalid grant" error

Your refresh token may have expired. Generate a new one using OAuth Playground.

### CORS errors in browser

Ensure your domain is added to "Authorized JavaScript origins" in Google Cloud Console.

### Popup blocked

If using popup sign-in, ensure popups are allowed for your domain. Alternatively, use redirect flow: `signIn(false)`.

### TypeScript errors with React

Make sure you have `@types/react` installed:

```bash
npm install --save-dev @types/react @types/react-dom
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT © Aadvik Labs

## Support

For issues and questions:

- GitHub Issues: [https://github.com/AadvikLabs/gdrive-asset-uploader-/issues](https://github.com/AadvikLabs/gdrive-asset-uploader-/issues)
- Documentation: [https://github.com/AadvikLabs/gdrive-asset-uploader-](https://github.com/AadvikLabs/gdrive-asset-uploader-)

---

**Made with ❤️ by Aadvik Labs**
