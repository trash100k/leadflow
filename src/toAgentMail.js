// Map a delivery payload (out/<slug>.delivery.json from prepare.js) into the
// arguments for the AgentMail MCP tools. Claude Code calls AgentMail directly
// (mcp__AgentMail__send_message / create_draft) — this just shapes the args so the
// delivery step is deterministic and repeatable.
//
//   touch=1 (cold first email): report card goes as a LINK in the body, NO attachment.
//   touch=reply (follow-up):    attach the real PDF (base64 from the payload).
//
// Usage: node src/toAgentMail.js <delivery.json> <inboxId> [send|draft] [touch1|reply]
import { readFile } from 'node:fs/promises';

export function toAgentMailArgs(payload, { inboxId, touch = 'touch1' } = {}) {
  const args = {
    inboxId,
    to: [payload.sendTo],
    subject: payload.subject,
    html: payload.htmlBody,
    text: payload.textBody,
  };
  // Only the reply/follow-up touch carries the PDF as an attachment; the cold first
  // touch links to the hosted report (already in html/text) to protect deliverability.
  if (touch === 'reply' && payload.pdf_base64) {
    args.attachments = [{ filename: payload.filename || 'GAELWORX-Report.pdf', content: payload.pdf_base64 }];
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , deliveryPath, inboxId, mode = 'draft', touch = 'touch1'] = process.argv;
  if (!deliveryPath || !inboxId) {
    console.error('usage: node src/toAgentMail.js <delivery.json> <inboxId> [send|draft] [touch1|reply]');
    process.exit(1);
  }
  const payload = JSON.parse(await readFile(deliveryPath, 'utf8'));
  const args = toAgentMailArgs(payload, { inboxId, touch });
  // Print the tool name to call + the args. (send_message sends; create_draft drafts.)
  console.log(JSON.stringify({
    tool: mode === 'send' ? 'mcp__AgentMail__send_message' : 'mcp__AgentMail__create_draft',
    args,
  }, null, 2));
}

export default toAgentMailArgs;
