import type { CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";
import { isAdmin } from "@/lib/bot";

const MIN_COOLDOWN = 0;
const MAX_COOLDOWN = 60;

export function parseCooldownMinutes(input: string): number | null {
  const normalized = input
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));

  if (!/^\d+$/.test(normalized)) return null;
  const minutes = Number(normalized);
  return Number.isSafeInteger(minutes) ? minutes : null;
}

async function setCooldown(ctx: BotContext) {
  const { msg } = ctx;
  if (!msg) return;
  if (!(await isAdmin(ctx))) return await ctx.replyTo(msg, ctx.t("cmd_admin_only"));

  const args = msg.text?.split(/\s+/).slice(1).join(" ").trim();

  if (!args) {
    return await ctx.richReply(ctx.t("cmd_setcooldown_usage", { min: MIN_COOLDOWN, max: MAX_COOLDOWN }), {
      reply_parameters: { message_id: msg.message_id, chat_id: msg.chat.id, allow_sending_without_reply: true },
    });
  }

  const minutes = parseCooldownMinutes(args);

  if (minutes === null) {
    return await ctx.richReply(ctx.t("cmd_setcooldown_invalid_number"), {
      reply_parameters: { message_id: msg.message_id, chat_id: msg.chat.id, allow_sending_without_reply: true },
    });
  }

  if (minutes < MIN_COOLDOWN || minutes > MAX_COOLDOWN) {
    return await ctx.richReply(ctx.t("cmd_setcooldown_out_of_range", { min: MIN_COOLDOWN, max: MAX_COOLDOWN }), {
      reply_parameters: { message_id: msg.message_id, chat_id: msg.chat.id, allow_sending_without_reply: true },
    });
  }

  const cooldownMs = minutes * 60 * 1000;

  await ctx.db
    .insert(schema.groups)
    .values({ id: String(msg.chat.id), name: msg.chat.title, cooldown: cooldownMs })
    .onConflictDoUpdate({
      target: [schema.groups.id],
      set: { name: msg.chat.title, cooldown: cooldownMs },
    });

  return await ctx.richReply(ctx.t("cmd_setcooldown_done", { minutes }), {
    reply_parameters: { message_id: msg.message_id, chat_id: msg.chat.id, allow_sending_without_reply: true },
  });
}

export const setCooldownHandler: CommandHandler = {
  kind: "command",
  name: "setcooldown",
  description: "⏱ تنظیم زمان انتظار دلقک",
  scopes: [{ type: "all_group_chats" }, { type: "all_chat_administrators" }],
  handler: setCooldown,
};
