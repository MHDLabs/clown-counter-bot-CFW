import { describe, expect, it } from "vitest";

import { translate } from "./i18n";

const rightToLeftMark = "\u200f";

describe("Persian right-to-left translation marks", () => {
  it.each(["cmd_start", "help_title", "help_text_triggers", "help_footer", "cmd_privacy", "cmd_resetstats_confirm"])(
    "marks every line of %s",
    (key) => {
      const text = translate("fa", key);

      expect(text.split("\n").every((line) => line.startsWith(rightToLeftMark))).toBe(true);
    },
  );

  it("marks newlines introduced by dynamic Fluent variables", () => {
    const text = translate("fa", "cmd_stats_group", {
      clowns: "نام یک\nنام دو",
      reset: "از امروز",
    });

    expect(text.split("\n").every((line) => line.startsWith(rightToLeftMark))).toBe(true);
  });

  it("does not alter English translations", () => {
    const text = translate("en", "cmd_start");

    expect(text.startsWith(rightToLeftMark)).toBe(false);
    expect(text).not.toContain(rightToLeftMark);
  });
});
