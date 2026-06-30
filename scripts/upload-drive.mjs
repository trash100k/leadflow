// Upload a PDF to Google Drive using googleapis npm package
// Usage: node scripts/upload-drive.mjs <pdf-path> <title>
import { readFileSync, createReadStream } from 'node:fs';
import { google } from 'googleapis';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [,, pdfPath, title] = process.argv;
if (!pdfPath || !title) {
  console.error('usage: node scripts/upload-drive.mjs <pdf-path> <title>');
  process.exit(1);
}

// The MCP proxy handles auth via CLOUDSDK_AUTH_ACCESS_TOKEN
// For googleapis, we need to get the real token from the environment or gcloud
// Try using Application Default Credentials which the proxy will handle
let auth;
try {
  auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
} catch (e) {
  console.error('Auth setup failed:', e.message);
  process.exit(1);
}

const drive = google.drive({ version: 'v3', auth });

const pdfStream = createReadStream(pdfPath);

try {
  const res = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: pdfStream,
    },
    fields: 'id,webViewLink,name',
  });

  // Make the file readable with a link
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const viewUrl = `https://drive.google.com/file/d/${res.data.id}/view`;
  console.log(JSON.stringify({ ok: true, id: res.data.id, viewUrl, name: res.data.name }));
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
}
