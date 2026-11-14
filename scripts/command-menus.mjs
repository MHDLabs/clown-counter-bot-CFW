const settingsCommands = [
  { command: "setcooldown", description: "Set group vote cooldown" },
  { command: "setgif", description: "Add clown GIF by reply" },
  { command: "removegif", description: "Remove clown GIF by reply" },
  { command: "setsticker", description: "Add clown sticker by reply" },
  { command: "removesticker", description: "Remove clown sticker by reply" },
  { command: "setunclowngif", description: "Add unclown GIF by reply" },
  { command: "removeunclowngif", description: "Remove unclown GIF by reply" },
  { command: "setunclownsticker", description: "Add unclown sticker by reply" },
  { command: "removeunclownsticker", description: "Remove unclown sticker by reply" },
  { command: "resetstats", description: "Reset group statistics" },
];

export const commandMenus = {
  private: [
    { command: "start", description: "Start Clown Counter" },
    { command: "help", description: "Detailed usage guide" },
    { command: "language", description: "Choose bot language" },
    { command: "privacy", description: "Privacy information" },
    { command: "source", description: "View source code" },
  ],
  // Settings names are listed for all group members so explicitly configured bot admins
  // can use them even when Telegram does not consider them group administrators.
  // Authorization is independently enforced by isAdmin before any setting changes.
  group: [
    { command: "help", description: "Detailed usage guide" },
    { command: "clown", description: "Vote clown for replied member" },
    { command: "unclown", description: "Lower clown score of replied member" },
    { command: "stats", description: "Show group statistics" },
    { command: "mystats", description: "Show personal group statistics" },
    { command: "clownoftheday", description: "Choose clown of the day" },
    ...settingsCommands,
  ],
  admin: settingsCommands,
};

// Telegram selects the most-specific matching command scope; it does not merge
// all_group_chats and all_chat_administrators command arrays for admins.
// Deduplicate because protected settings commands also appear in the group scope.
export const administratorMenu = [
  ...new Map([...commandMenus.group, ...commandMenus.admin].map((command) => [command.command, command])).values(),
];
