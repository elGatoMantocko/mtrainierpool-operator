import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { stub } from "@std/testing/mock";
import { getPrompt } from "../api/utils/operator.ts";

describe("getPrompt", () => {
  it("should return a prompt", () => {
    const now = Temporal.ZonedDateTime.from(
      "2026-06-30T11:16:18-07:00[America/Los_Angeles]",
    );

    const nowStub = stub(Temporal.Now, "zonedDateTimeISO", () => now);

    expect(getPrompt("The pool is closed today.")).toBe(
      `Current date and time: 2026-06-30T11:16:18-07:00 (Tuesday, timezone` +
        ` America/Los_Angeles, UTC offset -07:00)\n\nPool update message:` +
        ` The pool is closed today.`,
    );
    expect(getPrompt("Swim lessons are available!")).toBe(
      `Current date and time: 2026-06-30T11:16:18-07:00 (Tuesday, timezone` +
        ` America/Los_Angeles, UTC offset -07:00)\n\nPool update message:` +
        ` Swim lessons are available!`,
    );

    expect(nowStub.calls.length).toEqual(2);

    nowStub.restore();
  });
});
