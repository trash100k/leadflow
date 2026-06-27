// Reference copy of the n8n "GAELWORX Draft Delivery" workflow (id Ka6O5TOqkwlBJGm1).
// Built and validated via the n8n Workflow SDK. This is the ONLY n8n piece in the
// pipeline — a 3-node delivery connector. Claude Code does discovery, audit,
// native PDF render, and email writing; this turns one finished lead into a Gmail
// DRAFT (never sends) with the report-card PDF attached and an on-brand HTML body.
//
// Flow:  Webhook (POST /gaelworx-draft)  ->  Code (base64 -> PDF binary)  ->  Gmail draft/create
//
// Payload (webhook body): { sendTo, subject, htmlBody, textBody?, filename, pdf_base64, business }
// PREREQUISITE: attach a Gmail OAuth2 credential to "Create Gmail Draft".
import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const inbound = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Lead Payload In',
    parameters: {
      httpMethod: 'POST',
      path: 'gaelworx-draft',
      authentication: 'none',
      responseMode: 'lastNode',
      responseData: 'firstEntryJson',
    },
    position: [240, 300],
  },
  output: [{ body: { sendTo: 'owner@example.com', subject: 'A quick look at Example online', htmlBody: '<p>hi</p>', textBody: 'hi', filename: 'GAELWORX-Report-example.pdf', pdf_base64: 'JVBERi0x', business: 'Example' } }],
});

const toBinary = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Decode PDF + Normalize',
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: "const b = $json.body || $json || {};\nconst base64 = b.pdf_base64 || '';\nconst filename = b.filename || 'GAELWORX-Report.pdf';\nconst out = {\n  json: {\n    sendTo: b.sendTo || '',\n    subject: b.subject || 'A quick look at your website',\n    htmlBody: b.htmlBody || b.textBody || '',\n    business: b.business || '',\n    filename,\n  },\n  binary: {},\n};\nif (base64) {\n  out.binary.attachment = { data: base64, mimeType: 'application/pdf', fileName: filename };\n}\nreturn out;",
    },
    position: [520, 300],
  },
  output: [{ sendTo: 'owner@example.com', subject: 'A quick look at Example online', htmlBody: '<p>hi</p>', business: 'Example', filename: 'GAELWORX-Report-example.pdf' }],
});

const createDraft = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Create Gmail Draft',
    parameters: {
      resource: 'draft',
      operation: 'create',
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.htmlBody }}'),
      options: {
        sendTo: expr('{{ $json.sendTo }}'),
        attachmentsUi: { attachmentsBinary: [{ property: 'attachment' }] },
      },
    },
    credentials: { gmailOAuth2: newCredential('Gmail') },
    position: [800, 300],
  },
  output: [{ id: 'r-123', message: { id: 'm-123', threadId: 't-123' } }],
});

const note = sticky(
  '## GAELWORX Draft Delivery\nReceives one finished lead {sendTo, subject, htmlBody, filename, pdf_base64} and creates a Gmail DRAFT (never sends) with the report-card PDF attached.\n\nBEFORE USE: attach a Gmail OAuth2 credential to "Create Gmail Draft". Claude Code calls this per lead via execute_workflow (webhook input).',
  [inbound, toBinary, createDraft],
  { color: 4 },
);

export default workflow('gaelworx-draft-delivery', 'GAELWORX Draft Delivery')
  .add(inbound)
  .to(toBinary)
  .to(createDraft)
  .add(note);
