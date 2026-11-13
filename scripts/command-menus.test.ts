import { describe, expect, it } from "vitest";

import { handlers } from "@/handlers";

import { administratorMenu, commandMenus } from "./command-menus.mjs";

describe("Telegram command menus", () => {
  it("publishes the private commands including language selection", () => {
    expect(commandMenus.private.map(({ command }) => command)).toEqual(["start", "language", "privacy", "source"]);
  });

  it("publishes all common group commands", () => {
    expect(commandMenus.group.map(({ command }) => command)).toEqual(["clown", "unclown", "stats", "clownoftheday"]);
  });

  it("includes common group commands as well as admin tools for administrators", () => {
    const adminNames = administratorMenu.map(({ command }) => command);

    for (const command of commandMenus.group) expect(adminNames).toContain(command.command);
    for (const command of commandMenus.admin) expect(adminNames).toContain(command.command);

    expect(new Set(adminNames).size).toBe(adminNames.length);
  });

  it("exposes every registered command in all of its applicable menu scopes", () => {
    const names = (items: typeof commandMenus.private) => new Set(items.map(({ command }) => command));
    const privateNames = names(commandMenus.private);
    const groupNames = names(commandMenus.group);
    const adminNames = names(administratorMenu);
    const missing: string[] = [];

    for (const handler of handlers) {
      if (handler.kind !== "command") continue;
      if (handler.scopes.some((scope) => scope.type === "all_private_chats")) {
        if (!privateNames.has(handler.name)) missing.push(`private:${handler.name}`);
      }
      if (handler.scopes.some((scope) => scope.type === "all_group_chats")) {
        if (!groupNames.has(handler.name)) missing.push(`group:${handler.name}`);
      }
      if (handler.scopes.some((scope) => scope.type === "all_chat_administrators")) {
        if (!adminNames.has(handler.name)) missing.push(`administrator:${handler.name}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
