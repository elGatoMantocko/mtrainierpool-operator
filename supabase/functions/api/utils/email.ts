import { encodeBase64 } from "@std/encoding/base64";

const encoder = new TextEncoder();

// base64-encode content and hard-wrap at 76 chars per RFC 2045.
function base64Body(bytes: Uint8Array): string {
  return encodeBase64(bytes).replace(/.{76}/g, "$&\r\n");
}

export interface RawEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  ics: string;
}

// SES SendEmail can't carry attachments, so assemble a raw multipart/mixed
// MIME message: the HTML body plus the calendar invite as an .ics attachment.
export function buildRawEmail(opts: RawEmailOptions): Uint8Array {
  const boundary = `----=_Part_${crypto.randomUUID()}`;
  const message = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Body(encoder.encode(opts.html)),
    `--${boundary}`,
    'Content-Type: text/calendar; charset=UTF-8; method=REQUEST; name="invite.ics"',
    "Content-Transfer-Encoding: base64",
    'Content-Disposition: attachment; filename="invite.ics"',
    "",
    base64Body(encoder.encode(opts.ics)),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return encoder.encode(message);
}
