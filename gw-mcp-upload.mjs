import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

// Read MCP config
const mcpConf = JSON.parse(readFileSync('/tmp/mcp-config-cse_01U5uTDoSGE68yx9QhdXJK3d.json', 'utf8'));

// Find the Google Drive server (drivemcp.googleapis.com)
const driveEntry = Object.entries(mcpConf.mcpServers).find(([k, v]) => 
  v.url && v.url.includes('drive'));

if (!driveEntry) {
  console.error(JSON.stringify({ok: false, error: 'No Google Drive MCP server found'}));
  process.exit(1);
}

const [serverId, serverConfig] = driveEntry;
const mcpUrl = serverConfig.url;
const extraHeaders = serverConfig.headers || {};

console.error('Found Drive MCP server:', serverId);
console.error('URL:', mcpUrl.substring(0, 100) + '...');

// Read the PDF base64
const b64Data = (await readFile('/tmp/gw-b64-raw.txt', 'utf8')).trim();
console.error('b64 length:', b64Data.length);

// Create MCP client
const client = new Client({ name: 'gw-upload', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
  requestInit: {
    headers: extraHeaders
  }
});

try {
  await client.connect(transport);
  console.error('Connected to MCP server');
  
  const result = await client.callTool({
    name: 'create_file',
    arguments: {
      title: 'GAELWORX Report – Cypress Solar & Roofing',
      base64Content: b64Data,
      contentMimeType: 'application/pdf',
      disableConversionToGoogleType: true
    }
  });
  
  console.log(JSON.stringify({ok: true, result: result}));
  await client.close();
} catch (e) {
  console.log(JSON.stringify({ok: false, error: e.message}));
  process.exit(1);
}
