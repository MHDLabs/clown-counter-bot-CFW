import { describe, expect, it } from "vitest";

import { parseStatsPage } from "./stats";

describe("statistics page parsing", () => {
  it.each([
    ["0", 0],
    ["20", 20],
    ["100000", 100000],
  ])("accepts page %s", (input, expected) => {
    expect(parseStatsPage(input)).toBe(expected);
  });

  it.each(["", "-1", "1.5", "1e2", "100001", "1234567"])("rejects invalid page %s", (input) => {
    expect(parseStatsPage(input)).toBeNull();
  });
});
