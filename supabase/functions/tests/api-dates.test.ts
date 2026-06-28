import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { formatDate } from "../api/utils/dates.ts";

describe("formatDate", () => {
  it("should format a date", () => {
    expect(formatDate("2025-01-01T00:00:00.000Z")).toBe(
      "Tuesday, December 31, 2024 at 4:00 PM PST",
    );
    expect(formatDate("2026-06-28T14:12:00-07:00[America/Los_Angeles]"))
      .toBe(
        "Sunday, June 28, 2026 at 2:12 PM PDT",
      );
  });
});
