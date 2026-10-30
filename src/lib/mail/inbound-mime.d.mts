import type { MailAttachment } from './attachment-rules.mjs';
export const OVERSIZE_NOTICE: string;
export const UNSUPPORTED_NOTICE: string;
export function selectInboundAttachments(files: {filename:string;content:Uint8Array;contentId?:string}[]): {attachments:MailAttachment[];notice:string|null};
export function parseInboundMime(source: Uint8Array): Promise<{from:string;to:string;subject:string;text:string;html:string|null;messageId:string;inReplyTo:string;attachments:MailAttachment[];notice:string|null}>;
