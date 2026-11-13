# ربات دلقک‌شمار

ربات تلگرام برای رأی دلقک/آدم‌شدن، آمار گروه، رسانه‌های سفارشی و تنظیمات گروه. پاسخ‌ها با Fluent به فارسی یا انگلیسی ارائه می‌شوند.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MHDLabs/clown-counter-bot-CFW)

## قابلیت‌ها

- دستورهای `/clown` و `/unclown` و واکنش به 🤡/دلقک و 😇/ستون؛ برای رأی باید روی پیام عضو گروه پاسخ دهید.
- دستور `/help` راهنمای دقیق فارسی و انگلیسی دارد؛ `/language` زبان پاسخ دلخواه هر کاربر را ذخیره می‌کند.
- `/stats`، `/clownoftheday` و `/resetstats` مخصوص مدیران.
- تنظیمات مدیران: `/setcooldown`، `/setgif`، `/removegif`، `/setsticker`، `/removesticker`، `/setunclowngif`، `/removeunclowngif`، `/setunclownsticker` و `/removeunclownsticker`.
- نگهداری رأی‌ها، رسانه‌ها، زمان بازنشانی آمار و مهلت رأی به‌صورت جداگانه برای هر گروه.

`BOT_ADMIN_IDS` فهرستی از شناسه‌های عددی تلگرام است که اجازه دارند تنظیمات فعلی ربات (مهلت رأی، رسانه‌های سفارشی و بازنشانی آمار) را در گروه‌هایی که ربات عضو آن‌هاست مدیریت کنند؛ این افراد لازم نیست مدیر تلگرامی آن گروه باشند. دسترسی کاربران دیگر همچنان با وضعیت ادمین گروه کنترل می‌شود و همهٔ فرمان‌های تنظیمات در سرور بررسی می‌شوند. این فهرست دسترسی به Cloudflare یا کنسول پایگاه داده نمی‌دهد. شناسه‌ها به‌عنوان متغیر عادی Worker در `wrangler.jsonc` ثبت می‌شوند، نه secret.

## معماری

یک Cloudflare Worker با webhook تلگرام و آداپتور `cloudflare-mod` کتابخانه grammY اجرا می‌شود. یک پایگاه D1 تنها منبع داده پایدار است و با آداپتور D1 در Drizzle استفاده می‌شود. شناسه‌های تلگرام به شکل متن ده‌دهی ذخیره می‌شوند تا دقت شناسه‌های ۶۴بیتی حفظ شود. ایجاد رأی و بررسی مهلت با یک دستور شرطی و اتمیک SQLite انجام می‌شود. KV و Durable Object لازم نیستند.

رمز webhook از توکن ربات مشتق می‌شود و درخواست‌ها باید هدر معتبر `X-Telegram-Bot-Api-Secret-Token` داشته باشند. مسیر سلامت `/health` است. نیازی به سازگاری Node نیست؛ تنها Worker و D1 استفاده می‌شوند.

فناوری‌ها: TypeScript، Fetch API در Workers، grammY، Drizzle ORM، D1/SQLite، Fluent، Wrangler، pnpm و GitHub Actions.

## استقرار نسخه شخصی

دکمه بالا نسخه‌ای مستقل را در حساب Cloudflare خودتان مستقر می‌کند و D1 و Worker خودتان را می‌سازد. توکن ربات خود را به‌عنوان Worker secret با نام `BOT_TOKEN` تنظیم کنید. این روش به حساب Cloudflare یا Secrets گیت‌هاب نگه‌دارنده دسترسی ندارد.

پس از پایان استقرار، برای ثبت webhook و منوی فرمان تلگرام، از یک checkout محلی با وابستگی‌های نصب‌شده، نشانی Worker و همان توکن را به فرمان `pnpm set:webhook` بدهید؛ نمونهٔ دقیق فرمان در ادامه آمده است.

برای تنظیم دستی، ابتدا با [@BotFather](https://t.me/BotFather) ربات بسازید:

```sh
corepack enable
pnpm install
pnpm exec wrangler d1 create clown-counter-db
```

شناسه پایگاه ساخته‌شده را در `wrangler.jsonc` قرار دهید، سپس:

```sh
pnpm db:migrate:prod
pnpm exec wrangler secret put BOT_TOKEN
pnpm deploy
WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<token> pnpm set:webhook
```

## توسعه محلی و مهاجرت پایگاه

فایل `.dev.vars.example` را به `.dev.vars` کپی کنید و توکن خودتان را در آن قرار دهید:

```sh
cp .dev.vars.example .dev.vars
pnpm install
pnpm db:migrate:local
pnpm dev
```

مهاجرت SQLite ثبت‌شده در `drizzle/0001_initial.sql` است. `pnpm db:migrate:prod` فقط مهاجرت‌های اعمال‌نشده را اجرا می‌کند و پایگاه را حذف یا بازسازی نمی‌کند. برای بررسی مهاجرت محلی از `pnpm db:validate` استفاده کنید.

## استقرار خودکار نگه‌دارنده

این روش با دکمه عمومی کاملاً جداست و فقط برای مخزن `MHDLabs/clown-counter-bot-CFW` روی شاخه `main` اجرا می‌شود. GitHub Actions پس از گذراندن آزمون‌ها، در نخستین استقرار اگر `clown-counter-db` وجود نداشته باشد آن را می‌سازد؛ در اجراهای بعدی همان پایگاه را پیدا و استفاده می‌کند. سپس مهاجرت‌های معوق را اجرا می‌کند، Worker را مستقر می‌کند، توکن را به‌عنوان secret ثبت می‌کند و webhook را تنظیم می‌کند. پایگاه تولیدی حذف یا بازنشانی نمی‌شود.

در تنظیمات Secrets مخزن، `CLOUDFLARE_ACCOUNT_ID`، `CLOUDFLARE_API_TOKEN` با مجوز استقرار Worker و فهرست‌کردن، ساخت و مهاجرت D1، و `BOT_TOKEN` را وارد کنید. اجرای دستی نیز از `workflow_dispatch` پشتیبانی می‌شود. Pull requestها و forkها فقط آزمون اجرا می‌کنند و به مرحله استقرار دسترسی ندارند.

## امنیت، رفع اشکال و مشارکت

هیچ‌گاه `.dev.vars`، `.env` یا توکن‌ها را commit نکنید. اگر ربات پاسخ نمی‌دهد، مقدار secret ربات، وضعیت webhook، نام پایگاه D1 و مجوزهای Cloudflare را بررسی کنید. ثبت خطا عمداً پاسخ خام API و هدرهای حساس را چاپ نمی‌کند.

پیش از ارسال تغییر، `pnpm check`، `pnpm test`، `pnpm db:migrate:local`، `pnpm test:d1` و `pnpm build` را اجرا کنید. معماری تک‌Worker/تک-D1 و مهاجرت‌های غیرمخرب را حفظ کنید. این مخزن فعلاً فایل `LICENSE` ندارد و شرایط استفاده یا بازتوزیع مشخص نشده است.
