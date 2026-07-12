import { encodeBase64 } from "@std/encoding/base64";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { buildRawEmail } from "../api/utils/email.ts";

const decoder = new TextDecoder();

const options = {
  from: "pool@example.com",
  to: "swimmer@example.com",
  subject: "Mt. Rainier Pool — Closure Notice",
  html: "<html><body><h2>Closed</h2></body></html>",
  ics: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
};

describe("buildRawEmail", () => {
  it("sets the envelope headers", () => {
    const raw = decoder.decode(buildRawEmail(options));
    expect(raw).toContain("From: pool@example.com");
    expect(raw).toContain("To: swimmer@example.com");
    expect(raw).toContain("Subject: Mt. Rainier Pool — Closure Notice");
    expect(raw).toContain("MIME-Version: 1.0");
    expect(raw).toContain("Content-Type: multipart/mixed;");
  });

  it("attaches the calendar as an .ics part", () => {
    const raw = decoder.decode(buildRawEmail(options));
    expect(raw).toContain(
      'Content-Type: text/calendar; charset=UTF-8; method=REQUEST; name="invite.ics"',
    );
    expect(raw).toContain(
      'Content-Disposition: attachment; filename="invite.ics"',
    );
  });

  it("base64-encodes the html and ics bodies", () => {
    const raw = decoder.decode(buildRawEmail(options));
    const encoder = new TextEncoder();
    expect(raw).toContain(encodeBase64(encoder.encode(options.html)));
    expect(raw).toContain(encodeBase64(encoder.encode(options.ics)));
  });
});
