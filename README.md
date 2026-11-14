# Clown Counter Bot

A Persian/English Telegram group bot for playful clown and unclown voting, group statistics, custom media, and group settings.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MHDLabs/clown-counter-bot-CFW)

## Features

- `/clown` and `/unclown`, plus 🤡/دلقک and 😇/ستون text triggers; votes require replying to a group member.
- `/help` opens a Persian/English Rich Message guide with inline navigation buttons; `/language` saves each user's preferred reply language.
- `/stats`, `/mystats` (self or a replied-to group member), `/clownoftheday`, and admin-only `/resetstats`.
- Admin-only `/setcooldown`, `/setgif`, `/removegif`, `/setsticker`, `/removesticker`, `/setunclowngif`, `/removeunclowngif`, `/setunclownsticker`, and `/removeunclownsticker`.
- Per-group vote history, media IDs, reset time, and cooldown settings. Fluent translations are retained in Persian.
- Localized chat responses and inline-help pages use Telegram Rich Messages; Persian payloads enable right-to-left layout.

`BOT_ADMIN_IDS` is an optional, per-install comma-separated list of Telegram numeric user IDs allowed to manage the bot's existing group settings (cooldown, custom media, and statistics reset) in groups where the bot is present. It is empty by default; leave it empty to require Telegram group-admin status. Configure only your own IDs in your own Worker settings or `wrangler.jsonc`. The public template contains no maintainer-specific IDs. This allowlist grants no Cloudflare or database console access.

## Architecture

One Cloudflare Worker receives Telegram webhooks through grammY's `cloudflare-mod` adapter. One D1 database is the authoritative store, accessed through Drizzle's D1 adapter. SQLite stores Telegram identifiers as decimal text so their precision is retained. Vote creation is a conditional SQLite `INSERT` that enforces cooldown in one atomic statement; concurrent webhook deliveries cannot both pass the same cooldown check. No KV or Durable Object is required.

Technology stack: TypeScript, Cloudflare Workers Fetch API, grammY, Drizzle ORM, D1/SQLite, Fluent, Wrangler, pnpm, and GitHub Actions.

The app uses the Workers Fetch API and Web Crypto and does not require Node compatibility. A webhook secret is derived from the bot token; requests must carry Telegram's matching `X-Telegram-Bot-Api-Secret-Token` header. `/health` is a simple Worker health response. The configuration uses one Worker and one D1 database and only Cloudflare Workers/D1 resources; check current plan limits for your account before unusually high-volume use.

## Deploy your own copy

Use the Deploy to Cloudflare button above. Cloudflare clones the public repository into your GitHub account and provisions a Worker and D1 database in your Cloudflare account from `wrangler.jsonc`; resource names and values are scoped to your deployment. Enter your own Telegram bot token when prompted as the `BOT_TOKEN` Worker secret. `BOT_ADMIN_IDS` starts empty and can be set to your own comma-separated numeric IDs, or left empty so only Telegram group admins can change group settings. The configured `deploy` script applies this copy's D1 migrations before deploying its Worker. This flow does not access the maintainer's Cloudflare account or GitHub Actions secrets.

After the deployment finishes, register the Telegram webhook and command menu from a local checkout with dependencies installed, using the deployed Worker URL and the same bot token. The exact `pnpm set:webhook` command is shown below.

If configuring manually, create a Telegram bot with [@BotFather](https://t.me/BotFather), then:

```sh
corepack enable
pnpm install
pnpm exec wrangler d1 create clown-counter-db
```

Set the returned database ID in `wrangler.jsonc`, optionally set your own `BOT_ADMIN_IDS`, then deploy. The deploy script applies the checked-in migration first:

```sh
pnpm exec wrangler secret put BOT_TOKEN
pnpm deploy
WORKER_URL=https://<your-worker>.<your-subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
```

The webhook script registers `/telegram` and derives the same secret used by the Worker. Never commit bot tokens or local environment files.

## Local development and migrations

Create `.dev.vars` from the example and enter your own bot token:

```sh
cp .dev.vars.example .dev.vars
pnpm install
pnpm db:migrate:local
pnpm dev
```

Wrangler uses its local D1 database for `pnpm dev`. The committed SQLite migration is in `drizzle/0001_initial.sql`. Apply production migrations with `pnpm db:migrate:prod`; this applies pending migrations and does not reset or recreate a database. Validate the local migration set with `pnpm db:validate`.

## Maintainer automatic deployment

The GitHub Actions production deployment is separate from the public button. It runs only when the repository is exactly `MHDLabs/clown-counter-bot-CFW`, the ref is `main`, and validation succeeds. On the first run it creates `clown-counter-db` if it does not exist; later runs resolve and reuse that database. It applies pending migrations, deploys the Worker, stores `BOT_TOKEN` as a Worker secret, and registers the webhook. It never deletes or resets production data. Forks and pull requests run validation only; their workflow receives only read access to repository contents and cannot enter the production job or access the original repository's deployment secrets.

Make these Actions secrets available to the production job (prefer the `production` environment): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (Worker deployment plus D1 list, create, and migration permissions), and `BOT_TOKEN`. Optionally set `BOT_ADMIN_IDS` as a secret in that same environment to configure the maintainer's own comma-separated Telegram IDs; the workflow validates and injects it only into the production Worker. If omitted, it remains empty and Telegram group admins retain the standard group-management access. Fork Deploy Button installations remain separate and use their own Worker configuration. The workflow also supports manual runs with `workflow_dispatch`; the same repository/ref guard still applies. GitHub Actions are pinned to immutable SHAs on Node 24-compatible releases, and jobs use the fixed `ubuntu-24.04` runner to avoid floating-image migration warnings.

## Security and troubleshooting

Keep `.dev.vars`, `.env`, bot tokens, and Cloudflare API tokens private. The webhook secret is derived and is never logged. Ensure the Worker secret `BOT_TOKEN` is set and webhook registration succeeds; a deployment is not considered complete if registration fails. The maintainer D1 database is named `clown-counter-db`; first-time provisioning requires D1 create permission, while deployments reuse the same database thereafter. Wrangler logs intentionally omit raw upstream error objects and sensitive request headers.

## Contributing and license

Run `pnpm check`, `pnpm test`, `pnpm db:migrate:local`, `pnpm test:d1`, and `pnpm build` before opening a pull request. Preserve the one-Worker/one-D1 design and avoid destructive migrations. This repository currently has no `LICENSE` file; redistribution and reuse terms have not been specified.
