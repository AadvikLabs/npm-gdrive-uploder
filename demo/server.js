const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleDriveStorage } = require('../dist/GoogleDriveStorage');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Drive Storage
const driveStorage = new GoogleDriveStorage({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  rootFolderId: process.env.GOOGLE_FOLDER_ID,
});

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload endpoint
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log(`Uploading file: ${req.file.originalname}`);

    const result = await driveStorage.uploadFile(req.file.buffer, req.file.originalname, {
      makePublic: true,
      parents: [process.env.GOOGLE_FOLDER_ID]
    });

    res.json({
      success: true,
      fileId: result.fileId,
      fileName: result.fileName,
      viewUrl: result.webViewLink,
      downloadUrl: result.webContentLink || `https://drive.google.com/uc?export=download&id=${result.fileId}`
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * List files endpoint
 */
app.get('/api/files', async (req, res) => {
  try {
    const files = await driveStorage.listFiles({ pageSize: 10 });
    res.json({ success: true, files });
  } catch (error) {
    console.error('List files error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Demo server running at http://localhost:${port}`);
});
