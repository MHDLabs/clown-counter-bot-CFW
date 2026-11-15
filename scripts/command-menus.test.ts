import { describe, expect, it } from "vitest";

import { handlers } from "@/handlers";

import { administratorMenu, commandMenus } from "./command-menus.mjs";

describe("Telegram command menus", () => {
  it("publishes the private commands including language selection", () => {
    expect(commandMenus.private.map(({ command }) => command)).toEqual([
      "start",
      "help",
      "language",
      "privacy",
      "source",
    ]);
  });

  it("adds the owner panel only to the owner-specific private command menu", () => {
    expect(commandMenus.private.map(({ command }) => command)).not.toContain("admin_status");
    expect(commandMenus.owner.map(({ command }) => command)).toContain("admin_status");
  });

  it("publishes group commands and protected settings commands", () => {
    expect(commandMenus.group.map(({ command }) => command)).toEqual([
      "help",
      "clown",
      "unclown",
      "stats",
      "mystats",
      "clownoftheday",
      "clowngifs",
      "clownstickers",
      "setcooldown",
      "setgif",
      "removegif",
      "setsticker",
      "removesticker",
      "setunclowngif",
      "removeunclowngif",
      "setunclownsticker",
      "removeunclownsticker",
      "resetstats",
    ]);
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
    const ownerNames = names(commandMenus.owner);
    const groupNames = names(commandMenus.group);
    const adminNames = names(administratorMenu);
    const missing: string[] = [];

    for (const handler of handlers) {
      if (handler.kind !== "command") continue;
      if (handler.scopes.some((scope) => scope.type === "all_private_chats")) {
        const available =
          handler.name === "admin_status" ? ownerNames.has(handler.name) : privateNames.has(handler.name);
        if (!available) missing.push(`private:${handler.name}`);
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
