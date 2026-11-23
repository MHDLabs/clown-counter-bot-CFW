export const CREATOR = Object.freeze({
  username: "@Mahdi_CS30",
  channel: "@MHDLabs",
  channelUrl: "https://t.me/MHDLabs",
  repositoryUrl: "https://github.com/MHDLabs/clown-counter-bot-CFW",
});

/**
 * The first BOT_ADMIN_IDS entry is the canonical bot owner.
 * Remaining entries are additional trusted administrators.
 */
export function getOwnerTelegramId(adminIds?: ReadonlySet<string>): string {
  const ownerId = adminIds?.values().next().value;
  return ownerId && /^\d+$/.test(ownerId) ? ownerId : "—";
}
