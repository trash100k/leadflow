// Reference copy of the n8n "GAELWORX Delivery" workflow (id sWZvE2db8q7bmatR).
// Built + validated via the n8n Workflow SDK. The ONLY n8n piece in the pipeline.
// Claude Code does discovery, audit, native PDF render, and email writing; this
// turns one finished lead into either a Gmail draft or a sent email.
//
// Flow:  Webhook (POST /gaelworx-deliver) -> Decode + Normalize -> IF mode==send
//          mode=send  -> Gmail message/send  (cold first touch: report LINK in body,
//                        NO attachment, n8n attribution OFF)
//          mode=draft -> Gmail draft/create  (report-card PDF attached; review / reply)
//
// Payload (webhook body): { mode:'draft'|'send', sendTo, subject, htmlBody, textBody?,
//                           report_url?, filename?, pdf_base64?, business? }
// PREREQUISITES: attach a Gmail OAuth2 credential to BOTH Gmail nodes. Do NOT use
// mode=send until SPF/DKIM/DMARC + warm-up are in place (see DELIVERABILITY.md).
import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const inbound = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Lead Payload In',
    parameters: { httpMethod: 'POST', path: 'gaelworx-deliver', authentication: 'none', responseMode: 'lastNode', responseData: 'firstEntryJson' },
    position: [240, 300],
  },
  output: [{ body: { mode: 'draft', sendTo: 'owner@example.com', subject: 'A quick look at Example online', htmlBody: '<p>hi</p>', report_url: 'https://drive.google.com/file/d/EXAMPLE/view', filename: 'GAELWORX-Report-example.pdf', pdf_base64: 'JVBERi0x', business: 'Example' } }],
});

const decode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Decode + Normalize',
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: "const b = $json.body || $json || {};\nconst base64 = b.pdf_base64 || '';\nconst filename = b.filename || 'GAELWORX-Report.pdf';\nconst out = {\n  json: {\n    mode: (b.mode || 'draft'),\n    sendTo: b.sendTo || '',\n    subject: b.subject || 'A quick look at your website',\n    htmlBody: b.htmlBody || b.textBody || '',\n    report_url: b.report_url || '',\n    business: b.business || '',\n    filename,\n  },\n  binary: {},\n};\nif (base64) {\n  out.binary.attachment = { data: base64, mimeType: 'application/pdf', fileName: filename };\n}\nreturn out;",
    },
    position: [520, 300],
  },
  output: [{ mode: 'draft', sendTo: 'owner@example.com', subject: 'A quick look at Example online', htmlBody: '<p>hi</p>', report_url: 'https://drive.google.com/file/d/EXAMPLE/view', business: 'Example', filename: 'GAELWORX-Report-example.pdf' }],
});

const routeMode = ifElse({
  version: 2.2,
  config: {
    name: 'Send or Draft?',
    parameters: {
      conditions: {
        options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.mode }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'send' }],
        combinator: 'and',
      },
    },
    position: [800, 300],
  },
});

const sendMsg = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Email',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.sendTo }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.htmlBody }}'),
      options: { appendAttribution: false, senderName: 'GAELWORX' },
    },
    credentials: { gmailOAuth2: newCredential('Gmail') },
    position: [1080, 200],
  },
  output: [{ id: 'm-1', threadId: 't-1' }],
});

const draftMsg = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Create Draft',
    parameters: {
      resource: 'draft',
      operation: 'create',
      subject: expr('{{ $json.subject }}'),
      emailType: 'html',
      message: expr('{{ $json.htmlBody }}'),
      options: { sendTo: expr('{{ $json.sendTo }}'), attachmentsUi: { attachmentsBinary: [{ property: 'attachment' }] } },
    },
    credentials: { gmailOAuth2: newCredential('Gmail') },
    position: [1080, 400],
  },
  output: [{ id: 'r-1', message: { id: 'm-1', threadId: 't-1' } }],
});

const note = sticky(
  '## GAELWORX Delivery\nOne finished lead in via webhook -> Decode -> route on `mode`.\n- mode=send: Gmail message/send (cold first touch = report LINK in body, NO attachment; n8n attribution off).\n- mode=draft: Gmail draft/create with the report-card PDF attached (review path / reply follow-up).\n\nBEFORE USE: attach a Gmail OAuth2 credential to BOTH Gmail nodes. Do NOT switch to send until SPF/DKIM/DMARC + warm-up are in place (see DELIVERABILITY.md).',
  [inbound, decode, routeMode, sendMsg, draftMsg],
  { color: 4 },
);

export default workflow('gaelworx-delivery', 'GAELWORX Delivery')
  .add(inbound)
  .to(decode)
  .to(routeMode.onTrue(sendMsg).onFalse(draftMsg))
  .add(note);
