# 🤡 ربات دلقک‌شمار

یک ربات تلگرام فارسی/انگلیسی برای سرگرمی در گروه‌ها؛ رأی دلقک، آمار گروه، رسانه‌های سفارشی و چند ابزار مدیریتی ساده.

> [!NOTE]
> این ربات صرفاً برای سرگرمی ساخته شده است. امتیازها و عنوان‌های آن واقعی یا معیار ارزش‌گذاری افراد نیستند. از ربات برای آزار، تحقیر یا هدف‌گرفتن اعضای گروه استفاده نکنید.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MHDLabs/clown-counter-bot-CFW)

## ✨ قابلیت‌ها

- رأی مثبت و منفی با دستورهای `/clown` و `/unclown`؛ پیام هدف را در گروه Reply کنید.
- پشتیبانی از واکنش‌های متنی و ایموجی 🤡 و 😇.
- راهنمای تعاملی فارسی/انگلیسی با `/help` و انتخاب زبان با `/language`.
- آمار گروه با `/stats`، آمار شخصی با `/mystats` و انتخاب دلقک روز با `/clownoftheday`.
- رسانه‌های اختصاصی هر گروه؛ GIF و استیکر برای رأی دلقک و رأی معکوس.
- ارسال رسانه‌های ذخیره‌شده با `/clowngifs` و `/clownstickers`.
- تنظیم زمان انتظار رأی و بازنشانی دوره‌ای آمار توسط مدیران گروه.
- پاسخ‌های فارسی راست‌چین و ترجمه‌های انگلیسی.

## 🤖 دستورها

### عمومی و گروهی

- `/start`: شروع کار با ربات
- `/help`: راهنمای تعاملی
- `/language`: انتخاب زبان فارسی یا انگلیسی
- `/clown`: افزایش امتیاز دلقک عضو Reply‌شده
- `/unclown`: کاهش امتیاز دلقک عضو Reply‌شده
- `/stats`: نمایش آمار گروه
- `/mystats`: آمار خودتان؛ با Reply برای مشاهده آمار عضو دیگر
- `/clownoftheday`: انتخاب دلقک روز
- `/clowngifs`: ارسال GIFهای ذخیره‌شده گروه
- `/clownstickers`: ارسال استیکرهای ذخیره‌شده گروه
- `/privacy`: اطلاعات حریم خصوصی
- `/source`: نمایش سورس پروژه

### دستورهای مدیران گروه

- `/setcooldown <minutes>`: تنظیم فاصله رأی‌ها؛ از ۰ تا ۶۰ دقیقه
- `/setgif` و `/removegif`: افزودن یا حذف GIF دلقک با Reply به رسانه
- `/setsticker` و `/removesticker`: افزودن یا حذف استیکر دلقک با Reply
- `/setunclowngif` و `/removeunclowngif`: افزودن یا حذف GIF رأی معکوس
- `/setunclownsticker` و `/removeunclownsticker`: افزودن یا حذف استیکر رأی معکوس
- `/resetstats`: شروع فرایند بازنشانی آمار گروه
  برای رأی‌دادن، دستور را در پاسخ به پیام عضو موردنظر ارسال کنید. برای افزودن یا حذف رسانه نیز دستور مربوط را در Reply به همان GIF یا استیکر بفرستید. حداکثر سه رسانه از هر نوع برای هر گروه ذخیره می‌شود.

### پنل مدیر اصلی و whitelist گروه‌ها

شناسهٔ خودتان را در `BOT_ADMIN_IDS` تنظیم کنید. سپس در گفت‌وگوی خصوصی با ربات `/admin_status` را بفرستید؛ چون Telegram نام دستور رسمی را به حروف، عدد و زیرخط محدود می‌کند، شکل درخواستی `/admin-status` نیز به‌صورت alias نوشتاری خصوصی کار می‌کند. این دستورات برای مدیر گروه بودن نیاز ندارند و فقط شناسه‌های `BOT_ADMIN_IDS` مجازند.

پنل، تعداد گروه‌های ثبت‌شده و فعال، شمار کاربران دارای امتیاز خالص مثبت، و فهرست صفحه‌بندی‌شدهٔ گروه‌ها و دلقک‌ها را نشان می‌دهد. فقط نام نمایشی و امتیاز خالص نمایش داده می‌شود؛ شناسهٔ عددی اعضا، رأی‌دهندگان و تاریخچهٔ رأی‌ها در پنل نیستند. whitelist به‌صورت پیش‌فرض خاموش است؛ آن را روشن کنید تا ربات در گروه‌های خارج از فهرست بی‌صدا هیچ کاری نکند. گروه‌ها را از پنل اضافه یا حذف کنید؛ گفت‌وگوی خصوصی مالک از این محدودیت مستثناست.

فهرست شامل گروه‌هایی است که در D1 ثبت شده‌اند. رویدادهای Telegram از زمان انتشار قابلیت، گروه‌های تازه را خودکار ثبت می‌کنند؛ Telegram API فهرست گروه‌های قدیمی بات را نمی‌دهد، پس گروه‌های قبلی ممکن است تا دریافت یک update یا ثبت داده در آن‌ها در فهرست دیده نشوند.

## 🚀 راه‌اندازی با دکمه Cloudflare

این روش برای ساخت یک نسخه مستقل از ربات در حساب‌های خودتان است.

1. روی دکمه **Deploy to Cloudflare** بالای همین صفحه بزنید.
2. وارد حساب Cloudflare شوید و مراحل ساخت پروژه را ادامه دهید.
3. مخزن را در حساب GitHub خودتان ایجاد کنید و تنظیمات Worker و D1 را در فرایند Deploy بررسی کنید.
4. از [@BotFather](https://t.me/BotFather) یک ربات بسازید و توکن آن را دریافت کنید.
5. در ترمینال، داخل نسخه‌ای که از مخزن خودتان Clone کرده‌اید، توکن را به‌صورت Secret ثبت کنید:

   ```sh
   pnpm install
   pnpm exec wrangler login
   pnpm exec wrangler secret put BOT_TOKEN
   ```

6. پس از مشخص‌شدن نشانی Worker، webhook و منوی دستورهای تلگرام را ثبت کنید:

   ```sh
   WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
   ```

اگر فرایند Deploy برای D1 از شما شناسه پایگاه خواست، پایگاه D1 را در حساب Cloudflare خود بسازید و شناسه آن را در `wrangler.jsonc` برای binding با نام `DB` قرار دهید. هر نصب باید Worker، پایگاه داده و توکن مخصوص خودش را داشته باشد.

## 🛠 راه‌اندازی دستی با ترمینال

### پیش‌نیازها

- حساب Cloudflare با دسترسی Workers و D1
- حساب GitHub برای نگهداری نسخه شخصی (اختیاری، اما برای Deploy Button و CI مفید است)
- ربات تلگرام ساخته‌شده با [@BotFather](https://t.me/BotFather)
- Node.js نسخه ۲۲ یا جدیدتر و Corepack

### ۱. دریافت پروژه و نصب وابستگی‌ها

```sh
git clone https://github.com/MHDLabs/clown-counter-bot-CFW.git
cd clown-counter-bot-CFW

corepack enable
pnpm install
pnpm exec wrangler login
```

### ۲. ساخت پایگاه D1

```sh
pnpm exec wrangler d1 create clown-counter-db
```

شناسه `database_id` که Cloudflare برمی‌گرداند را در بخش `d1_databases` فایل `wrangler.jsonc` جایگزین مقدار نمونه کنید. مقدار binding باید `DB` و نام پایگاه `clown-counter-db` باشد.

### ۳. تنظیم مدیران اختیاری

به‌صورت پیش‌فرض، مدیران خود گروه اجازه تغییر تنظیمات ربات را دارند. اگر می‌خواهید شناسه‌های تلگرام مشخصی نیز اجازه مدیریت داشته باشند، مقدار `BOT_ADMIN_IDS` را در `vars` فایل `wrangler.jsonc` با شناسه‌های عددی و جداشده با کاما تنظیم کنید:

```jsonc
"vars": {
  "BOT_ADMIN_IDS": "123456789,987654321"
}
```

این فهرست دسترسی مدیر اصلی ربات، پنل خصوصی و مدیریت تنظیمات گروه را می‌دهد؛ اما دسترسی Cloudflare یا D1 ایجاد نمی‌کند. فقط شناسه‌هایی را وارد کنید که به آن‌ها اعتماد دارید و شناسه شخصی را در مخزن عمومی قرار ندهید.

### ۴. ثبت توکن و Deploy

```sh
pnpm exec wrangler secret put BOT_TOKEN
pnpm deploy
```

فرمان `pnpm deploy` ابتدا مهاجرت‌های اعمال‌نشده D1 را اجرا می‌کند و سپس Worker را Deploy می‌کند.

### ۵. ثبت webhook تلگرام

نشانی Worker را از خروجی Deploy بردارید و دستور زیر را با توکن واقعی اجرا کنید:

```sh
WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
```

این اسکریپت webhook را روی مسیر `/telegram` تنظیم می‌کند، رویداد عضویت ربات در گروه را فعال می‌کند و منوی دستورهای تلگرام را ثبت می‌کند. `BOT_ADMIN_IDS` را هم به همان محیط اجرای فرمان بدهید تا منوی پنل فقط برای مدیر اصلی نمایش داده شود:

```sh
BOT_ADMIN_IDS=<your-telegram-id> WORKER_URL=https://<worker>.<subdomain>.workers.dev BOT_TOKEN=<your-token> pnpm set:webhook
```

در پایان، آدرس `https://<worker>.<subdomain>.workers.dev/health` باید پاسخ `{"ok":true}` بدهد.

## 💻 توسعه محلی

فایل نمونه را کپی کنید:

```sh
cp .dev.vars.example .dev.vars
```

توکن ربات را در فایل محلی `.dev.vars` قرار دهید:

```env
BOT_TOKEN=your-telegram-bot-token
```

سپس:

```sh
pnpm install
pnpm db:migrate:local
pnpm dev
```

برای بررسی و تست پروژه:

```sh
pnpm check
pnpm test
pnpm db:validate
pnpm test:d1
pnpm build
```

مهاجرت‌های پایگاه در پوشه `drizzle/` نگهداری می‌شوند. برای اعمال مهاجرت‌های Production از `pnpm db:migrate:prod` استفاده کنید؛ این فرمان مهاجرت‌های جدید را اعمال می‌کند و پایگاه را حذف یا از نو ایجاد نمی‌کند.

## 🧱 معماری

- یک Cloudflare Worker با webhook و آداپتور `cloudflare-mod` از grammY
- یک Cloudflare D1 به‌عنوان پایگاه داده اصلی
- Drizzle ORM با SQLite/D1
- TypeScript، Fluent، Wrangler و pnpm
- GitHub Actions برای اعتبارسنجی و استقرار مخزن اصلی

شناسه‌های تلگرام به‌صورت متن ذخیره می‌شوند تا دقت عددی آن‌ها حفظ شود. کنترل مهلت رأی با یک عملیات شرطی SQLite انجام می‌شود. برای معماری فعلی به KV یا Durable Objects نیازی نیست.

## 🔐 امنیت

- توکن ربات را فقط به‌صورت Worker Secret با نام `BOT_TOKEN` ثبت کنید.
- فایل‌های `.dev.vars` و `.env` و توکن‌های Cloudflare یا Telegram را Commit نکنید.
- webhook با Secret مشتق‌شده از توکن اعتبارسنجی می‌شود.
- هر نصب باید از منابع و Secrets مستقل خودش استفاده کند.
- مسیر `/health` فقط وضعیت پاسخ‌گویی Worker را بررسی می‌کند.

## 📄 مجوز

این پروژه تحت مجوز [MIT](LICENSE) منتشر می‌شود. متن کامل مجوز در فایل `LICENSE` قرار دارد.

---

**Made with ☕ by [MHDLabs](https://github.com/MHDLabs)**

Keep it simple :)
