# Static Commands
cmd_start =
    👀 ای جویندهٔ دلقک‌شماری، خوش اومدی!
    
    من رباتی برای ثبت امتیازهای سرگرمی در گروه هستم. برای رأی‌دادن، روی پیام یک عضو Reply کن و /clown یا 🤡 بفرست. برای کاهش امتیاز از /unclown یا 😇 استفاده کن.
    
    برای واکنش مستقیم به ایموجی، کلمه‌ها یا رسانه‌های ذخیره‌شده بدون Reply، تلگرام باید پیام‌های عادی گروه را به ربات تحویل بدهد. هنگام نصب می‌توانی با تنظیم BOT_READ_ALL_GROUP_MESSAGES، Privacy Mode را آگاهانه خاموش کنی.
    
    🔏 حریم خصوصی: /privacy
    🖥 سورس‌کد پروژه: /source
cmd_privacy =
    🔒 حریم خصوصی و اطلاعات ذخیره‌شده
    
    ربات برای کارکردن اطلاعات زیر را در D1 نگه می‌دارد:
    - شناسه و نام نمایشی کاربران و گروه‌ها
    - رأی‌ها، مقدار امتیاز و زمان ثبت هر رأی
    - تنظیمات هر گروه، مهلت رأی و زمان شروع دورهٔ فعلی آمار
    - شناسهٔ فایل‌های Telegram برای GIF و استیکرهای سفارشی
    - زبان انتخابی کاربران
    - وضعیت عضویت ربات در گروه‌ها و فهرست گروه‌های مجاز
    - شمارندهٔ تلاش‌های تکراری تا پایان مهلت انتظار
    - شناسهٔ پیام‌های پیش‌نمایش رسانه‌ها برای پاک‌سازی بعدی
- شناسهٔ Updateهای تلگرام و وضعیت پردازش آن‌ها برای جلوگیری از اجرای تکراری؛ حداکثر هفت روز
    
    ربات آرشیو متن گفتگوها یا تاریخچهٔ پیام‌ها را ذخیره نمی‌کند. اگر Privacy Mode تلگرام را خاموش کنید، تلگرام پیام‌های عادی بیشتری از گروه را به ربات تحویل می‌دهد. رأی‌ها برای محاسبهٔ آمار نگهداری می‌شوند؛ Reset فقط دورهٔ آماری را جابه‌جا می‌کند و رأی‌های قبلی را حذف نمی‌کند.
    
    مدیران تعیین‌شدهٔ ربات می‌توانند در گفت‌وگوی خصوصی نام گروه‌ها و امتیاز خالص فعلی اعضا را ببینند؛ پنل شناسهٔ عددی اعضا، رأی‌دهندگان یا تاریخچهٔ رأی را نمایش نمی‌دهد.
    
    برای مشاهدهٔ سورس از /source استفاده کنید.
cmd_source =
    ✨ دلقک‌شمار یک پروژه متن‌بازه!

    این به این معنیه که شما دسترسی کامل به سورس‌کد این ربات دارین و می‌تونید روی سرور خودتون اجراش کنید، شخصی‌سازیش کنید یا حتی به توسعه‌ش کمک کنید!

    🪄 ریپازیتوری پروژه:
    https://github.com/haashemi/clown-counter-bot

# Clown command
cmd_clown_is_me = 🤡 آره داداش بذار ربات رو دلقک کنم خیلی کار باحالیه به ذهن کسی هم نمی‌رسه ای وای که چقدر باهوشم من. پر از هوش و ذکاوت و استعداد نهفته دارم اینجا حیف میشم. خندیدیم داداش، حالا لفت بده. 🙏
cmd_clown_is_bot = 🥰 عزیزم، اینی که می‌خوای دلقکش کنی، یه رباته. ربات یک شخص نیست. نمی‌تونه دلقک باشه.
cmd_clown_is_you = دا؟ خودت رو می‌خوای دلقک کنی؟ چرا آخه؟ هم صحبت نیاز داری؟ کاری از دست ما بر میاد؟ 😭
cmd_clown_usage = برای ثبت رأی دلقکی، روی پیام یکی از اعضای گروه پاسخ بده و /clown یا 🤡 را بفرست.
cmd_clown_wait = ⏳ هنوز زوده! { $waitMin } دقیقه دیگه می‌تونی دلقک کنی.
cmd_clown = {"\u200F"}🤡 { $clown } توسط { $voter } دلقک شد!

# Unclown command
cmd_unclown_is_me = 🤫 در تلاشی سطح منو بیاری پایین؟ فکر کردی من کم دلقکم؟ من خیلی دلقکم!

cmd_unclown_is_bot = 😭 اینی که می‌خوای دلقکش کنی رباته... چیکارت کرده؟

cmd_unclown_is_you = 😂 دلقک واقعی تویی که فکر می‌کنی می‌تونی رتبه دلقکیتو بیاری پایین
cmd_unclown_usage = برای کاهش امتیاز دلقکی، روی پیام یکی از اعضای گروه پاسخ بده و /unclown یا 😇 را بفرست.

cmd_unclown_wait = ⏳ هنوز زوده! { $waitMin } دقیقه دیگه می‌تونی ضد دلقک رو اجرا کنی. نگران نباش کسی از تو دلقک‌تر نمیشه.

cmd_unclown = {"\u200F"}💀 سطح دلقکی { $clown } توسط { $voter } کاهش یافت!

# Public commands
cmd_stats_no_clown =
    دلقک‌های گروه شما هنوز مشخص نیست.

    نظرت چیه اولیش خودت باشی؟ 🤡

cmd_stats_group =
    🔥 دلقک‌های برتر گروه

    { $clowns }{ $reset }

cmd_stats_group_clown = {"\u200F"}— { $name } با { $votes } رای

cmd_stats_reset_at = 🕐 آمار از { $date } شمرده می‌شود.

# Clown of the day
cmd_clown_of_the_day_wait = ⏳ دلقک روز امروز انتخاب شده! فردا دوباره سر بزن. 🤡
cmd_clown_of_the_day_no_users =
    😐 هنوز کسی توی این گروه دلقک نشده که بتونم انتخابش کنم!

    اول با دستور clown/ یکی رو دلقک کن، بعد بیا سراغ دلقک روز. 🤡
cmd_clown_of_the_day = {"\u200F"}👑 دلقک امروز: { $clown } — با { $quantity } رای دلقکی!

# Admin commands
cmd_trigger_usage =
    🪄 گیف/استیکر دلقک

    اگه ادمین گروهی، دستور /trigger رو روی یک گیف یا استیکر ریپلای کن تا انتخاب کنی «دلقک کننده» باشه یا «دلقک‌بردار».
    📋 لیست و حذف همه: /triggers
    📌 از هر نوع حداکثر { $max } تا.

cmd_trigger_prompt =
    🪄 تنظیم { $media ->
        [sticker] استیکر
       *[animation] گیف
    }

    { $state ->
        [clown] وضعیت فعلی: 🤡 دلقک کننده
        [unclown] وضعیت فعلی: 😇 دلقک‌بردار
       *[none] وضعیت فعلی: تنظیم نشده
    }

trigger_btn_clown = 🤡 دلقک کننده
trigger_btn_unclown = 😇 دلقک‌بردار
trigger_btn_remove = 🗑 حذف

trigger_saved = ✅ ذخیره شد.
trigger_removed = 🗑 حذف شد.
trigger_limit = 😐 ظرفیت پره! از هر نوع حداکثر { $max } تا. اول یکی رو با /triggers حذف کن.
trigger_gone = 😐 پیام گیف/استیکر پیدا نشد. دوباره /trigger رو روش بزن.
trigger_not_admin = 😐 فقط ادمین‌ها می‌تونن گیف/استیکرها رو تغییر بدن.

cmd_triggers_empty =
    😐 هیچ گیف یا استیکری تنظیم نشده.

    روی یکی ریپلای کن و /trigger رو بزن.

cmd_triggers_summary = 📋 { $count } گیف/استیکر تنظیم شده. برای حذف هر کدوم، دکمه‌ی زیرش رو بزن.

triggers_btn_delete = { $action ->
        [unclown] 🗑 حذف (😇 دلقک‌بردار)
       *[clown] 🗑 حذف (🤡 دلقک کننده)
    }

triggers_no_preview =
    { $media ->
        [sticker] 🎭 استیکر
       *[animation] 🎞 گیف
    } قدیمی، بدون پیش‌نمایش

    اولین باری که توی گروه فرستاده بشه، پیش‌نمایشش ذخیره می‌شه.

triggers_btn_clear = 🧹 حذف همه
triggers_clear_confirm = ⚠️ همه‌ی گیف‌ها و استیکرهای دلقک این گروه حذف می‌شن. مطمئنی؟
triggers_clear_yes = ✅ آره، حذف کن
triggers_clear_no = ❌ نه
triggers_cleared = 🧹 همه‌ی گیف‌ها و استیکرها حذف شدن.
triggers_clear_cancelled = 🤝 هیچی حذف نشد.

cmd_setcooldown_usage =
    ⏱ تنظیم زمان انتظار دلقک

    بعد از دلقک کردن، چند دقیقه باید صبر کنی تا دوباره بتونی دلقک کنی؟

    💡 استفاده: /setcooldown <دقیقه>
    📌 محدوده: { $min } تا { $max } دقیقه
    📍 مقدار پیش‌فرض: ۱۰ دقیقه

cmd_setcooldown_invalid_number =
    😐 عددی که وارد کردی معتبر نیست.

    یه عدد صحیح وارد کن.

cmd_setcooldown_out_of_range =
    😐 عدد باید بین { $min } تا { $max } دقیقه باشه.

cmd_setcooldown_done =
    ✅ زمان انتظار دلقک روی { $minutes } دقیقه تنظیم شد.

cmd_resetstats_confirm =
    ⚠️ ریست آمار گروه

    همه‌ی آمار دلقک‌ها از این لحظه ریست می‌شه و شمارش از صفر شروع می‌شه.
    مطمئنی؟

cmd_resetstats_confirm_yes = ✅ بله، ریست کن
cmd_resetstats_confirm_no = ❌ نه، منصرف شدم

cmd_resetstats_done =
    ✅ آمار گروه با موفقیت ریست شد!

    از این به بعد دلقک‌ها از همین لحظه شمرده می‌شن.

cmd_resetstats_cancelled =
    🤝 عملیات ریست لغو شد، آمار دست‌نخورده موند.

cmd_resetstats_not_admin =
    😐 فقط ادمین‌ها می‌تونن آمار رو ریست کنن.

# Additional MHDLabs features and interface labels

cmd_creator_credit = سازندهٔ پروژه: { $creator } — شناسه مالک: { $owner_id }

cmd_creator_channel = کانال سازنده

cmd_source_repository = مشاهده سورس پروژه


cmd_language_prompt = زبان پاسخ‌های ربات را انتخاب کنید:

cmd_language_persian = فارسی

cmd_language_english = English

cmd_language_saved = زبان انتخاب‌شده ذخیره شد.

# Clown command

cmd_clown_gifs_empty =
    😐 هنوز گیفی برای این گروه تنظیم نشده است. روی یک GIF یا انیمیشن Reply کنید و /trigger را بفرستید.
cmd_clown_stickers_empty =
    😐 هنوز استیکری برای این گروه تنظیم نشده است. روی یک استیکر Reply کنید و /trigger را بفرستید.
cmd_admin_only = 😐 فقط ادمین‌های گروه می‌تونن این تنظیم رو تغییر بدن.




help_title = 🤡 راهنمای ربات دلقک‌شمار

help_intro = برای دیدن راهنمای هر بخش، یکی از دکمه‌های زیر را بزنید.

help_home_heading = امکانات ربات

help_home_voting = رأی‌دادن با ریپلای به پیام عضو گروه.

help_home_group_stats = مشاهدهٔ آمار کل گروه و دلقک روز.

help_home_personal_stats = مشاهدهٔ امتیاز شخصی خود یا عضو دیگری با /mystats.

help_home_settings = تنظیم مهلت رأی، آمار و رسانه‌های سفارشی برای مدیران.

help_home_footer = زبان، حریم خصوصی و کد منبع را از بخش «بیشتر» پیدا کنید.

help_button_home = 🏠 راهنما

help_button_voting = 🤡 رأی‌دادن

help_button_group_stats = 📊 آمار گروه

help_button_personal_stats = 👤 آمار شخصی

help_button_admin = ⚙️ تنظیمات

help_button_account = 🔒 بیشتر

help_voting_heading = رأی‌دادن در گروه

help_vote_add = برای افزودن امتیاز، روی پیام عضو گروه ریپلای کنید و /clown یا 🤡 بفرستید.

help_vote_remove = برای کم‌کردن امتیاز، روی پیام او ریپلای کنید و /unclown یا 😇 بفرستید.

help_vote_limits = نمی‌توانید به خودتان، ربات یا کاربر ربات رأی بدهید.

help_vote_cooldown = مهلت رأی هر کاربر در هر گروه جداست؛ پیش‌فرض ۱۰ دقیقه.

help_text_triggers = واکنش به 🤡 / دلقک، 😇 / ستون / آدم عاقل و رسانه‌های سفارشی نیاز دارد تلگرام پیام‌های گروه را به ربات برساند. شاید لازم باشد Privacy Mode را در BotFather خاموش کنید یا ربات را با دسترسی محدود ادمین کنید. دستورهای رأی همراه با ریپلای به خواندن همهٔ پیام‌ها نیاز ندارند.

help_vote_footer = هر رأی باید در پاسخ به پیام عضو هدف فرستاده شود.

help_group_heading = آمار گروه

help_stats = /stats — نمایش جدول امتیازهای همین گروه.

help_clown_of_day = /clownoftheday — انتخاب تصادفی دلقک روز؛ روزی یک‌بار بر اساس تقویم تهران و با ۵ تا ۲۰ رأی اضافه.

help_group_footer = آمار و تنظیمات هر گروه مستقل است.

help_personal_heading = آمار شخصی در گروه

help_personal_self = /mystats — دیدن امتیاز، امتیازهای اضافه‌شده و امتیازهای کم‌شدهٔ خودتان در همین گروه.

help_personal_reply = برای دیدن آمار عضو دیگری، روی یکی از پیام‌های او ریپلای کنید و /mystats بفرستید.

help_personal_period = آمار از ابتدای دورهٔ فعلی محاسبه می‌شود؛ بعد از /resetstats دورهٔ تازه آغاز می‌شود.

help_admin_heading = تنظیمات مدیران

help_admin_intro =
    مدیران گروه و شناسه‌هایی که در BOT_ADMIN_IDS تنظیم شده‌اند می‌توانند تنظیمات گروه را تغییر دهند. بررسی مدیر بودن در تلگرام به دسترسی مناسب ربات نیاز دارد.
help_set_cooldown = /setcooldown <دقیقه> — تنظیم مهلت رأی از ۰ تا ۶۰ دقیقه؛ پیش‌فرض ۱۰.

help_reset_stats = /resetstats — شروع دورهٔ تازهٔ آمار؛ سابقهٔ رأی‌ها حذف نمی‌شود.

help_custom_clown_media =
    برای ثبت GIF/انیمیشن یا استیکر، روی آن Reply کنید و /trigger بفرستید؛ سپس نوع اثر را انتخاب کنید. با /triggers رسانه‌ها را ببینید، تکی حذف کنید یا همه را پاک کنید. از هر نوع و هر عملیات حداکثر ۳ مورد.
help_custom_unclown_media = همان دستور /trigger برای هر دو عملیات دلقک‌کردن و کم‌کردن امتیاز استفاده می‌شود. برای اجرای رسانهٔ ذخیره‌شده، آن را در پاسخ به پیام عضو هدف بفرستید.

help_private_heading = گفت‌وگوی خصوصی

help_language = /language — ذخیرهٔ زبان پاسخ‌ها (فارسی یا English).

help_privacy_source = /privacy — جزئیات داده‌ها. /source — کد منبع. /start — معرفی ربات.

help_footer = برای بازگشت یا رفتن به بخش دیگر، از دکمه‌های همین پیام استفاده کنید.

cmd_mystats_title = 📊 آمار این دورهٔ { $name }

cmd_mystats_score = امتیاز خالص دلقکی: { $score }

cmd_mystats_received = امتیازهای اضافه‌شده: { $received }

cmd_mystats_removed = امتیازهای کم‌شده: { $removed }

cmd_mystats_unavailable = کاربر هدف مشخص نیست. دستور را در پاسخ به پیام یک عضو بفرستید.

cmd_clown_media_legacy =
    رسانه‌های قدیمی شناسه‌ای دارند که تلگرام نمی‌تواند آن را ارسال کند. روی هر GIF یا استیکر اصلی Reply کنید و دوباره /trigger را بفرستید تا با شناسهٔ معتبر ذخیره شود.
cmd_clown_media_send_failed =
    😕 تلگرام نتوانست یکی یا چند رسانهٔ ذخیره‌شده را ارسال کند. رسانهٔ مشکل‌دار را دوباره با دستور تنظیم مربوط ثبت کنید.

# Owner-only bot status and group allowlist

admin_title = 🤡 پنل مدیر اصلی ربات

admin_metric_groups = گروه‌های ثبت‌شده: { $count }

admin_metric_active_groups = عضویت‌های تأییدشدهٔ فعال: { $count }

admin_metric_clowns = افراد یکتای دارای امتیاز خالص مثبت در دورهٔ فعلی: { $count }

admin_metric_whitelist = حالت whitelist: { $mode } — گروه‌های مجاز: { $count }

admin_whitelist_enabled = فعال

admin_whitelist_disabled = غیرفعال

admin_groups_title = گروه‌های شناخته‌شدهٔ ربات

admin_groups_empty = هنوز گروهی در پایگاه داده ثبت نشده است. گروه‌هایی که از این پس ربات به آن‌ها افزوده شود، خودکار ثبت می‌شوند.

admin_groups_note = برای مشاهدهٔ فهرست دلقک‌ها یا تغییر whitelist، یک گروه را انتخاب کنید. شناسه‌های عددی نمایش داده نمی‌شوند. تلگرام فهرست گروه‌های قدیمی را در اختیار ربات نمی‌گذارد؛ ممکن است تا دریافت یک رویداد از گروه، آن گروه شناخته نشود.

admin_group_unnamed = گروه بدون نام

admin_group_active = عضویت فعال

admin_group_inactive = عضو نیست

admin_group_unknown = وضعیت نامشخص

admin_group_line = { $name } — { $status } — whitelist: { $whitelist }

admin_group_membership = وضعیت عضویت ربات: { $status }

admin_group_allowlist = دسترسی در whitelist: { $status }

admin_group_clowns_title = دلقک‌های این گروه بر اساس امتیاز خالص

admin_clown_line = { $name } — امتیاز خالص: { $score }

admin_group_no_clowns = در دورهٔ فعلی فردی امتیاز خالص مثبت ندارد.

admin_group_privacy_note = فقط نام نمایشی و امتیاز خالص دیده می‌شود؛ شناسه، رأی‌دهنده و زمان رأی نمایش داده نمی‌شود.

admin_group_missing = این گروه دیگر در پایگاه دادهٔ ربات موجود نیست.

admin_page = صفحهٔ { $current } از { $total }

admin_button_groups = فهرست گروه‌ها

admin_button_home = بازگشت به پنل

admin_button_previous = صفحهٔ قبل

admin_button_next = صفحهٔ بعد

admin_button_allow_group = افزودن به whitelist

admin_button_remove_group = حذف از whitelist

admin_button_enable_whitelist = فعال‌کردن whitelist

admin_button_disable_whitelist = خاموش‌کردن whitelist

admin_button_creator_channel = کانال سازنده

admin_creator = سازندهٔ پروژه: { $creator } — شناسه مالک ربات: { $owner_id }

admin_whitelist_needs_group = پیش از فعال‌کردن whitelist، دست‌کم یک گروه را به فهرست مجاز اضافه کنید.

admin_group_not_active = تلگرام تأیید می‌کند که ربات دیگر عضو این گروه نیست. برای افزودن آن به whitelist، ابتدا ربات را دوباره به گروه اضافه کنید.

admin_error = بارگذاری پنل انجام نشد. کمی بعد دوباره تلاش کنید.



cmd_stats_group_page = صفحهٔ { $current } از { $total }

# رسانه‌های سفارشی و محرک‌ها

trigger_media_animation = این گیف/انیمیشن

trigger_media_sticker = این استیکر

trigger_state_clown = اضافه‌کردن امتیاز دلقکی

trigger_state_unclown = کم‌کردن امتیاز دلقکی

trigger_state_unset = تنظیم‌نشده

trigger_btn_delete = 🗑 حذف

trigger_btn_clear = حذف همه

trigger_clear_yes = ✅ پاک کن

trigger_clear_no = لغو

trigger_clear_confirm = تمام گیف‌ها و استیکرهای سفارشی این گروه حذف شوند؟

trigger_cleared = تمام محرک‌های رسانه‌ای سفارشی حذف شدند.

trigger_clear_cancelled = عملیات حذف همه لغو شد.

trigger_missing_media = گیف یا استیکر پاسخ‌داده‌شده در این پیام در دسترس نیست.

trigger_not_found = این رسانهٔ ذخیره‌شده پیدا نشد.

trigger_stale_media = پیش‌نمایش { $media } ذخیره‌شده ممکن نشد؛ با این حال می‌توانید آن را با دکمه حذف کنید.


# Public owner identity and whitelist notices

whitelist_group_disabled =
    🚫 ربات در این گروه غیرفعال شد.

    حالت whitelist برای ربات فعال است و این گروه در فهرست گروه‌های مجاز قرار ندارد. از این لحظه ربات هیچ فرمان یا پیام گروه را پردازش نمی‌کند. برای فعال‌سازی دوباره، مالک ربات باید این گروه را به فهرست مجاز اضافه کند.

    👨‍💻 سازنده: { $creator }
    🆔 شناسه مالک ربات: { $owner_id }
    📢 کانال سازنده: { $channel }
    🔗 سورس پروژه: { $repository }


whitelist_button_source = 🧩 سورس پروژه

whitelist_button_channel = 📢 کانال سازنده


panel_close = ✖ بستن
