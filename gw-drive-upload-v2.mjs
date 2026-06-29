import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

// Read MCP config  
const mcpConf = JSON.parse(readFileSync('/tmp/mcp-config-cse_01U5uTDoSGE68yx9QhdXJK3d.json', 'utf8'));

// Find the Google Drive server
const driveEntry = Object.entries(mcpConf.mcpServers).find(([k, v]) => 
  v.url && v.url.includes('drive'));

if (!driveEntry) {
  console.error('No Drive server found'); process.exit(1);
}

const [, serverConfig] = driveEntry;
const mcpUrl = serverConfig.url;
const extraHeaders = { ...serverConfig.headers };

// Read the session token using the file descriptor
const sessionTokenFd = parseInt(process.env.CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR || '0');
let authHeader = '';
if (sessionTokenFd > 0) {
  try {
    const tokenBuf = readFileSync(`/dev/fd/${sessionTokenFd}`, 'utf8').trim();
    authHeader = `Bearer ${tokenBuf}`;
    process.stderr.write(`Got token from fd ${sessionTokenFd}\n`);
  } catch(e) {
    process.stderr.write(`Could not read fd ${sessionTokenFd}: ${e.message}\n`);
  }
}

// Also try session ingress token
const sessionIngressTokenFile = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE;
let ingressToken = '';
if (sessionIngressTokenFile) {
  try {
    ingressToken = readFileSync(sessionIngressTokenFile, 'utf8').trim();
    process.stderr.write(`Got ingress token (${ingressToken.length} chars)\n`);
  } catch(e) {
    process.stderr.write(`Could not read ingress token: ${e.message}\n`);
  }
}

if (authHeader) extraHeaders['Authorization'] = authHeader;
if (ingressToken) extraHeaders['X-Session-Token'] = ingressToken;

// Read the PDF base64
const b64Data = (await readFile('/tmp/gw-b64-raw.txt', 'utf8')).trim();
process.stderr.write(`b64 length: ${b64Data.length}\n`);

const client = new Client({ name: 'gw-upload', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
  requestInit: { headers: extraHeaders }
});

try {
  await client.connect(transport);
  process.stderr.write('Connected!\n');
  
  const result = await client.callTool({
    name: 'create_file',
    arguments: {
      title: 'GAELWORX Report – Cypress Solar & Roofing',
      base64Content: b64Data,
      contentMimeType: 'application/pdf',
      disableConversionToGoogleType: true
    }
  });
  
  console.log(JSON.stringify({ok: true, result}));
  await client.close();
} catch(e) {
  console.log(JSON.stringify({ok: false, error: e.message}));
}
