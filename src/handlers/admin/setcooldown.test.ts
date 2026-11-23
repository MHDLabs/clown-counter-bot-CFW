import { describe, expect, it } from "vitest";

import { parseCooldownMinutes } from "./setcooldown";

describe("cooldown minute parsing", () => {
  it.each([
    ["10", 10],
    ["۰", 0],
    ["۱۰", 10],
    ["٦", 6],
    ["۶۰", 60],
  ])("parses %s", (input, expected) => {
    expect(parseCooldownMinutes(input)).toBe(expected);
  });

  it.each(["", "1e1", "0x10", "2.5", "-1", "١٠x", "９００７１９９２۵۴７۴۰۹۹۲"])(
    "rejects non-decimal or unsafe input %s",
    (input) => {
      expect(parseCooldownMinutes(input)).toBeNull();
    },
  );
});
