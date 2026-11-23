import { describe, expect, it } from "vitest";

import { dayBoundsInTimeZone, localizeDate, TIME_ZONE } from "./date";

describe("timezone-aware dates", () => {
  it("uses the Tehran calendar day rather than UTC midnight", () => {
    const beforeTehranMidnight = new Date("2026-11-22T20:29:59.999Z");
    const atTehranMidnight = new Date("2026-11-22T20:30:00.000Z");

    const before = dayBoundsInTimeZone(beforeTehranMidnight);
    const after = dayBoundsInTimeZone(atTehranMidnight);

    expect(before.end).toBe(after.start);
    expect(after.start).toBe(Date.parse("2026-11-22T20:30:00.000Z"));
    expect(after.end).toBe(Date.parse("2026-11-23T20:30:00.000Z"));
    expect(TIME_ZONE).toBe("Asia/Tehran");
  });

  it("formats dates in Persian using the same timezone", () => {
    expect(localizeDate(new Date("2026-11-22T20:30:00.000Z"))).toContain("۱۴۰۵");
  });
});
