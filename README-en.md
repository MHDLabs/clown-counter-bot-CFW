# 🤡 Clown Counter Bot

A Persian/English Telegram group bot for fun: clown voting, group statistics, custom media, and a few simple moderation settings.

> [!NOTE]
> This bot is made for entertainment only. Scores and playful labels are not real judgments or measures of anyone's worth. Do not use it to harass, shame, or target group members.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MHDLabs/clown-counter-bot-CFW)

## ✨ Features

- Add or remove clown votes with `/clown` and `/unclown`; reply to a member's message in a group.
- Text and emoji triggers, including 🤡 and 😇.
- Interactive Persian/English help with `/help` and language selection with `/language`.
- Paginated group statistics (20 entries per page) with `/stats`, personal statistics with `/mystats`, and Tehran-day clown selection with `/clownoftheday`.
- Per-group custom GIFs and stickers configured for clown or unclown actions with `/trigger`.
- List, remove, or clear saved media with `/triggers`; clear-all also removes the preview messages sent by the bot.
- Configurable vote cooldown and statistics reset for group admins.
- Persian right-to-left messages and English translations.

## 🤖 Commands

### General and group commands

- `/start`: Start the bot
- `/help`: Open the interactive guide
- `/language`: Choose Persian or English
- `/clown`: Increase the replied member's clown score
- `/unclown`: Decrease the replied member's clown score
- `/stats`: Show group statistics
- In groups, you can target the bot explicitly, for example `/stats@MHDLabs_clownbot`.
- `/mystats`: Show your stats; reply to a member to view theirs
- `/clownoftheday`: Pick the clown of the Tehran calendar day
- `/trigger`: Configure a GIF, animation, or sticker with interactive action buttons
- `/triggers`: List, remove one, or clear all saved custom media
- `/privacy`: Show privacy information
- `/source`: Show the project source

### Group-admin commands

- `/setcooldown <minutes>`: Set the vote cooldown, from 0 to 60 minutes
- `/trigger`: Reply to a GIF, animation, or sticker, then choose whether it adds or removes a clown point.
- `/triggers`: List saved media, remove individual entries, or clear all after confirmation. Up to three items per media type and action.
- `/resetstats`: Start the group statistics reset flow
  Reply to the target member's message when voting. To configure custom media, reply to the GIF or sticker with `/trigger`; after choosing an action, the first selector closes and a fresh status selector opens. All interactive panels have a close button.

### Bot owner panel and group allowlist

Put the bot owner's Telegram ID as the **first entry** in `BOT_ADMIN_IDS`; this ID is shown in the owner panel and whitelist notices. Additional entries are trusted administrators. In a private chat with the bot, use `/admin_status`; Telegram only accepts letters, numbers, and underscores in registered command names, so the requested `/admin-status` spelling is also supported as a manually typed private alias. This is separate from Telegram group-admin status, and only IDs in `BOT_ADMIN_IDS` can use it.

The interactive panel shows registered/active group counts, distinct members with a positive net clown score, and paginated group and leaderboard views. It displays only group/member display names and net scores—not numeric member IDs, voters, or vote history. Whitelist mode is off by default. When enabled, each known active group outside the allowlist receives one deactivation notice with the owner ID, creator channel, and source link; after that, the bot ignores commands and messages in that group. Groups added to the allowlist become active again. Private chats remain available to everyone; the shared public messages use the original upstream wording.

The list contains groups recorded in D1. Telegram membership updates will record new group additions from deployment onward, but Telegram's API does not expose a complete list of the bot's older chats; a pre-existing group may remain unknown until the bot receives an update or records data there.

## 🚀 Deploy with the Cloudflare button

This creates an independent copy of the bot in your own accounts.

1. Click **Deploy to Cloudflare** above.
2. Sign in to Cloudflare and follow the deployment flow.
3. Create the repository in your own GitHub account and review the Worker and D1 configuration.
4. Create a Telegram bot with [@BotFather](https://t.me/BotFather) and copy its token.
5. In a terminal, from your own cloned repository, install dependencies and authenticate Wrangler:

   ```sh
   pnpm install
   pnpm exec wrangler login
   pnpm exec wrangler secret put BOT_TOKEN
   ```

6. Once the Worker URL is available, register the Telegram webhook and command menus:

   ```sh
   WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
   ```

If the deployment flow asks for a D1 database ID, create a D1 database in your Cloudflare account and set its ID in `wrangler.jsonc` for the `DB` binding. Each installation must use its own Worker, database, and bot token.

## 🛠 Manual deployment from a terminal

### Requirements

- A Cloudflare account with Workers and D1 access
- A GitHub account for your own copy (optional, but useful for the Deploy button and CI)
- A Telegram bot created through [@BotFather](https://t.me/BotFather)
- Node.js 22 or newer with Corepack

### 1. Clone the repository

```sh
git clone https://github.com/MHDLabs/clown-counter-bot-CFW.git
cd clown-counter-bot-CFW

corepack enable
pnpm install
pnpm exec wrangler login
```

### 2. Create the D1 database

```sh
pnpm exec wrangler d1 create clown-counter-db
```

Copy the returned `database_id` into `wrangler.jsonc`, replacing the placeholder under `d1_databases`. Keep the binding name as `DB` and the database name as `clown-counter-db`.

### 3. Optional: configure bot admins

By default, Telegram group administrators can manage the bot's group settings. To allow specific Telegram user IDs as well, set `BOT_ADMIN_IDS` in the `vars` section of `wrangler.jsonc`, using comma-separated numeric IDs:

```jsonc
"vars": {
  "BOT_ADMIN_IDS": "123456789,987654321"
}
```

This allowlist grants bot-owner access to the private panel and bot/group settings, but not Cloudflare or D1 access. Only include trusted IDs, and do not put personal IDs in the public template. The first ID in this list is displayed as the bot owner's ID.

### 4. Add the bot token and deploy

```sh
pnpm exec wrangler secret put BOT_TOKEN
pnpm deploy
```

The `pnpm deploy` script applies pending D1 migrations and then deploys the Worker.

### 5. Register the Telegram webhook

Use the Worker URL printed by Wrangler:

```sh
WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
```

This script registers the webhook at `/telegram`, enables bot-membership updates, and configures Telegram command menus. Pass the same `BOT_ADMIN_IDS` value so the owner-specific command menu is installed:

```sh
BOT_ADMIN_IDS=<your-telegram-id> WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
```

The endpoint `https://<worker>.<subdomain>.workers.dev/health` should return `{"ok":true}`.

## 💻 Local development

Copy the example environment file:

```sh
cp .dev.vars.example .dev.vars
```

Add your bot token to `.dev.vars`:

```env
BOT_TOKEN=your-telegram-bot-token
```

Then run:

```sh
pnpm install
pnpm db:migrate:local
pnpm dev
```

Run the project checks with:

```sh
pnpm check
pnpm test
pnpm db:validate
pnpm test:d1
pnpm build
```

Database migrations live in `drizzle/`. Use `pnpm db:migrate:prod` to apply pending production migrations. It does not delete or recreate the database.

## 🧱 Architecture

- One Cloudflare Worker using Telegram webhooks and grammY's `cloudflare-mod` adapter
- One Cloudflare D1 database as the source of persistent data
- Drizzle ORM with SQLite/D1
- TypeScript, Fluent, Wrangler, and pnpm
- GitHub Actions for validation and deployment of the upstream repository

Telegram user and group identifiers are stored as text to preserve their full numeric precision. When Telegram upgrades a basic group to a supergroup, the bot migrates votes, settings, media, allowlist membership, and cooldown state to the new chat ID. Vote cooldown enforcement uses a conditional SQLite operation. The current architecture does not require KV or Durable Objects.

## 🔐 Security

- Store the bot token as a Worker Secret named `BOT_TOKEN`.
- Never commit `.dev.vars`, `.env`, Telegram tokens, or Cloudflare credentials.
- Webhook requests are verified with a secret derived from the bot token.
- Every installation should use its own resources and secrets.
- The `/health` endpoint only reports whether the Worker is responding.

## 📄 License

This project is released under the [MIT License](LICENSE). See the `LICENSE` file for the full text.

---

**Made with ☕ by [MHDLabs](https://github.com/MHDLabs)**

Keep it simple :)
