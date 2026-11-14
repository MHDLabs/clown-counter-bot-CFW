# ربات دلقک‌شمار

ربات تلگرام برای رأی دلقک/آدم‌شدن، آمار گروه، رسانه‌های سفارشی و تنظیمات گروه. پاسخ‌ها با Fluent به فارسی یا انگلیسی ارائه می‌شوند.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MHDLabs/clown-counter-bot-CFW)

## قابلیت‌ها

- دستورهای `/clown` و `/unclown` و واکنش به 🤡/دلقک و 😇/ستون؛ برای رأی باید روی پیام عضو گروه پاسخ دهید.
- دستور `/help` راهنمای فارسی/انگلیسی با دکمه‌های تعاملی و قالب Rich Message دارد؛ `/language` زبان پاسخ دلخواه هر کاربر را ذخیره می‌کند.
- `/stats`، `/mystats` (آمار خودتان یا کاربری که به پیامش پاسخ می‌دهید)، `/clownoftheday` و `/resetstats` مخصوص مدیران.
- تنظیمات مدیران: `/setcooldown`، `/setgif`، `/removegif`، `/setsticker`، `/removesticker`، `/setunclowngif`، `/removeunclowngif`، `/setunclownsticker` و `/removeunclownsticker`.
- نگهداری رأی‌ها، رسانه‌ها، زمان بازنشانی آمار و مهلت رأی به‌صورت جداگانه برای هر گروه.
- پاسخ‌های متنی و صفحه‌های راهنما با Rich Message تلگرام ارسال می‌شوند؛ پیام‌های فارسی جهت راست‌به‌چپ دارند.

`BOT_ADMIN_IDS` فهرستی اختیاری و مستقل برای هر نصب از شناسه‌های عددی تلگرام است که اجازه دارند تنظیمات فعلی ربات (مهلت رأی، رسانه‌های سفارشی و بازنشانی آمار) را در گروه‌ها مدیریت کنند. مقدار پیش‌فرض خالی است؛ در این حالت فقط مدیران همان گروه دسترسی دارند. فقط شناسه‌های خودتان را در تنظیمات Worker خودتان یا `wrangler.jsonc` وارد کنید. مخزن عمومی هیچ شناسهٔ مخصوص نگه‌دارنده‌ای ندارد. این فهرست دسترسی به Cloudflare یا پایگاه داده نمی‌دهد.

## معماری

یک Cloudflare Worker با webhook تلگرام و آداپتور `cloudflare-mod` کتابخانه grammY اجرا می‌شود. یک پایگاه D1 تنها منبع داده پایدار است و با آداپتور D1 در Drizzle استفاده می‌شود. شناسه‌های تلگرام به شکل متن ده‌دهی ذخیره می‌شوند تا دقت شناسه‌های ۶۴بیتی حفظ شود. ایجاد رأی و بررسی مهلت با یک دستور شرطی و اتمیک SQLite انجام می‌شود. KV و Durable Object لازم نیستند.

رمز webhook از توکن ربات مشتق می‌شود و درخواست‌ها باید هدر معتبر `X-Telegram-Bot-Api-Secret-Token` داشته باشند. مسیر سلامت `/health` است. نیازی به سازگاری Node نیست؛ تنها Worker و D1 استفاده می‌شوند.

فناوری‌ها: TypeScript، Fetch API در Workers، grammY، Drizzle ORM، D1/SQLite، Fluent، Wrangler، pnpm و GitHub Actions.

## استقرار نسخه شخصی

دکمه بالا مخزن را در حساب GitHub شما clone می‌کند و یک Worker و D1 مستقل را در حساب Cloudflare خودتان بر اساس `wrangler.jsonc` می‌سازد؛ نام منابع و تنظیمات متعلق به همان نصب است. هنگام راه‌اندازی، توکن ربات خودتان را برای secret با نام `BOT_TOKEN` وارد کنید. `BOT_ADMIN_IDS` به‌طور پیش‌فرض خالی است؛ می‌توانید شناسه‌های عددی خودتان را با ویرگول جدا کنید یا خالی بگذارید تا فقط مدیران گروه تنظیمات را تغییر دهند. فرمان `deploy` مهاجرت‌های D1 همین نسخه را پیش از انتشار Worker اجرا می‌کند. این روش به حساب Cloudflare یا Secrets گیت‌هاب نگه‌دارنده دسترسی ندارد.

پس از پایان استقرار، برای ثبت webhook و منوی فرمان تلگرام، از یک checkout محلی با وابستگی‌های نصب‌شده، نشانی Worker و همان توکن را به فرمان `pnpm set:webhook` بدهید؛ نمونهٔ دقیق فرمان در ادامه آمده است.

برای تنظیم دستی، ابتدا با [@BotFather](https://t.me/BotFather) ربات بسازید:

```sh
corepack enable
pnpm install
pnpm exec wrangler d1 create clown-counter-db
```

شناسه پایگاه ساخته‌شده را در `wrangler.jsonc` قرار دهید و در صورت نیاز `BOT_ADMIN_IDS` خودتان را تنظیم کنید، سپس:

```sh
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

این روش با دکمه عمومی جداست و فقط وقتی اجرا می‌شود که مخزن دقیقاً `MHDLabs/clown-counter-bot-CFW` و شاخه `main` باشد و اعتبارسنجی موفق شده باشد. در نخستین اجرای maintainer اگر `clown-counter-db` وجود نداشته باشد ساخته می‌شود؛ در اجراهای بعدی همان پایگاه استفاده می‌شود. مهاجرت‌های معوق اجرا می‌شوند، Worker مستقر می‌شود، توکن به‌عنوان secret ثبت می‌شود و webhook تنظیم می‌شود. پایگاه تولیدی حذف یا بازنشانی نمی‌شود. Forkها و pull requestها فقط آزمون اجرا می‌کنند؛ توکن Actions آن‌ها فقط دسترسی خواندن مخزن دارد و job استقرار یا secrets مخزن اصلی در دسترسشان نیست.

این secrets باید برای job استقرار در دسترس باشند (ترجیحاً در Environment با نام `production`): `CLOUDFLARE_ACCOUNT_ID`، `CLOUDFLARE_API_TOKEN` با مجوز استقرار Worker و فهرست‌کردن، ساخت و مهاجرت D1، و `BOT_TOKEN`. اجرای دستی نیز از `workflow_dispatch` پشتیبانی می‌شود و همان شرط مخزن/شاخه را دارد. Actionها روی نسخه‌های immutable و سازگار با Node 24 pin شده‌اند و runner روی `ubuntu-24.04` ثابت است تا هشدار image شناور حذف شود.

## امنیت، رفع اشکال و مشارکت

هیچ‌گاه `.dev.vars`، `.env` یا توکن‌ها را commit نکنید. اگر ربات پاسخ نمی‌دهد، مقدار secret ربات، وضعیت webhook، نام پایگاه D1 و مجوزهای Cloudflare را بررسی کنید. ثبت خطا عمداً پاسخ خام API و هدرهای حساس را چاپ نمی‌کند.

پیش از ارسال تغییر، `pnpm check`، `pnpm test`، `pnpm db:migrate:local`، `pnpm test:d1` و `pnpm build` را اجرا کنید. معماری تک‌Worker/تک-D1 و مهاجرت‌های غیرمخرب را حفظ کنید. این مخزن فعلاً فایل `LICENSE` ندارد و شرایط استفاده یا بازتوزیع مشخص نشده است.
