/**
 * Render a stored timestamptz as a friendly zoned datetime in the pool's local
 * timezone (the timezone the pool-operator model resolves all times against).
 * e.g. "Sunday, June 28, 2026 at 12:00 AM PDT".
 */
export function formatDate(value: string): string {
  // Pass the timeZone explicitly: ZonedDateTime.toLocaleString does not reliably
  // inherit the instance's zone in this runtime (it falls back to UTC), so format
  // the parsed Instant through Intl with the zone pinned.
  return Temporal.Instant.from(value).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
