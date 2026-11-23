# Static Commands
cmd_start =
    👀 ای جوینده‌ی دلقک شماری، خوش اومدی!

    من یه رباتم که آمار دلقک بودن همگروهی‌هاتون رو مدیریت می‌کنم. من به رو به گروهت اضافه کن و با ریپلای کردن دستور clown/ روی همگروهی‌هات، امتیاز دلقکیشون رو افزایش بده!

    می‌تونی با ریپلای کردن «دلقک» و «🤡» هم این کار رو انجام بدی، ولی قبلش لازمه که بهم اجازه‌ی دیدن پیام‌ها رو بدی و برا این کار نیازه که ادمینم کنی.

    🔏 حریم شخصی: /privacy
    🖥 سورس‌کد پروژه: /source

    🤡 @ClownCounterBot

cmd_privacy =
    🔒 حریم شخصی کاربران

    ربات دلقک شمار رباتی برای خوش‌گذرونی بین شما و دوستانتونه. اما ممکنه برای برخی این نگرانی رو به وجود بیاره که «این ربات چقدر دسترسی داره؟»
    قطعا خوندن این متن قرار نیست چیزی رو ثابت کنه، اما در نهایت نوشتنش رو به ننوشتنش ترجیح دادیم.

    🗃 چه اطلاعاتی ذخیره میشن؟

    این ربات تنها اطلاعات کلیدی‌ای که بدون اون‌ها نمی‌تونه کار کنه رو ذخیره می‌کنه. اعم از نام و آیدی عددی گروه، دلقک کننده، دلقک شونده و زمان دلقک شدن افراد. این‌ها تنها داده‌هایی هستن که در دیتابیس ربات ذخیره میشن و بدون اون‌ها عملا نمی‌تونه کار کنه و چاره‌ای جز ذخیره‌سازیشون نداریم.

    🕵️‍♂️ آیا گفتگوها جایی نوشته میشن؟

    خیر! ربات بصورت پیشفرض هیچ تمایلی به حتی دریافت پیام کاربران هم نداره. تنها در صورتی که مایلید از دستورات متنی مانند «دلقک» و «🤡» استفاده کنید و به ما اعتماد کافی دارید، می‌تونید اون رو ادمین کنید (با حداقل دسترسی) تا به ربات این اجازه رو بدید که این دستورات متنی رو ببینه و بهشون جواب بده.

    👨‍💻 آیا سورس‌کد پروژه موجوده؟

    بله! این ربات تماما متن‌باز هست و می‌تونید با دستور /source بهش دسترسی داشته باشید.

    ❤️ امیدواریم که در حین استفاده از این ربات حسابی بهتون خوش بگذره!

cmd_source =
    ✨ دلقک‌شمار یک پروژه متن‌بازه!

    این به این معنیه که شما دسترسی کامل به سورس‌کد این ربات دارین و می‌تونید روی سرور خودتون اجراش کنید، شخصی‌سازیش کنید یا حتی به توسعه‌ش کمک کنید!

    🪄 ریپازیتوری پروژه:
    https://github.com/haashemi/clown-counter-bot

# Clown command
cmd_clown_is_me = 🤡 آره داداش بذار ربات رو دلقک کنم خیلی کار باحالیه به ذهن کسی هم نمی‌رسه ای وای که چقدر باهوشم من. پر از هوش و ذکاوت و استعداد نهفته دارم اینجا حیف میشم. خندیدیم داداش، حالا لفت بده. 🙏
cmd_clown_is_bot = 🥰 عزیزم، اینی که می‌خوای دلقکش کنی، یه رباته. ربات یک شخص نیست. نمی‌تونه دلقک باشه.
cmd_clown_is_you = دا؟ خودت رو می‌خوای دلقک کنی؟ چرا آخه؟ هم صحبت نیاز داری؟ کاری از دست ما بر میاد؟ 😭
cmd_clown_wait = ⏳ هنوز زوده! { $waitMin } دقیقه دیگه می‌تونی دلقک کنی.
cmd_clown = {"\u200F"}🤡 { $clown } توسط { $voter } دلقک شد!

# Unclown command
cmd_unclown_is_me = 🤫 در تلاشی سطح منو بیاری پایین؟ فکر کردی من کم دلقکم؟ من خیلی دلقکم!

cmd_unclown_is_bot = 😭 اینی که می‌خوای دلقکش کنی رباته... چیکارت کرده؟

cmd_unclown_is_you = 😂 دلقک واقعی تویی که فکر می‌کنی می‌تونی رتبه دلقکیتو بیاری پایین

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

cmd_setgif =
    🪄 گیف کاستوم برای دلقک کردن!

    اگه ادمین گروهی، همین دستور setgif/ رو روی یک گیف ریپلای کن تا اون گیف به عنوان «دلقک کننده» ست بشه.
    📌 حداکثر ۳ گیف قابل تنظیم است.


cmd_setgif_invalid =
    😐 ادمین دلقک ندیده بودیم که دیدیم.

    یَره، موگوم روی «گیف» ریپلای کن. این چیه ریپلای کردی روش الان؟


cmd_setgif_limit =
    😐 ظرفیت گیف‌ها پره!

    حداکثر ۳ گیف قابل تنظیمه. اول یکی رو با /removegif حذف کن.


cmd_setgif_done =
    👀 گیف جدید برای دلقک کردن تنظیم شد. ({ $count } از { $max })


cmd_removegif_usage =
    🪄 حذف گیف دلقک کننده!

    روی یک گیف ریپلای کن و دستور /removegif رو بزن تا اون گیف حذف بشه.


cmd_removegif_invalid =
    😐 روی یک «گیف» ریپلای کن.


cmd_removegif_empty =
    😐 هیچ گیفی تنظیم نشده!

    اول با /setgif یک گیف اضافه کن.


cmd_removegif_not_found =
    😐 این گیف در لیست گیف‌های تنظیم شده نیست.


cmd_removegif_done =
    👀 گیف از لیست حذف شد.


cmd_setsticker =
    🪄 استیکر کاستوم برای دلقک کردن!

    اگه ادمین گروهی، همین دستور setsticker/ رو روی یک استیکر ریپلای کن تا اون استیکر به عنوان «دلقک کننده» ست بشه.
    📌 حداکثر ۳ استیکر قابل تنظیم است.


cmd_setsticker_invalid =
    😐 ادمین دلقک ندیده بودیم که دیدیم.

    یَره، موگوم روی «استیکر» ریپلای کن. این چیه ریپلای کردی روش الان؟


cmd_setsticker_limit =
    😐 ظرفیت استیکرها پره!

    حداکثر ۳ استیکر قابل تنظیمه. اول یکی رو با /removesticker حذف کن.


cmd_setsticker_done =
    👀 استیکر جدید برای دلقک کردن تنظیم شد. ({ $count } از { $max })


cmd_removesticker_usage =
    🪄 حذف استیکر دلقک کننده!

    روی یک استیکر ریپلای کن و دستور /removesticker رو بزن تا اون استیکر حذف بشه.


cmd_removesticker_invalid =
    😐 روی یک «استیکر» ریپلای کن.


cmd_removesticker_empty =
    😐 هیچ استیکری تنظیم نشده!

    اول با /setsticker یک استیکر اضافه کن.


cmd_removesticker_not_found =
    😐 این استیکر در لیست استیکرهای تنظیم شده نیست.


cmd_removesticker_done =
    👀 استیکر از لیست حذف شد.


cmd_clown_gifs_empty =
    😐 هنوز هیچ گیف دلقکی برای این گروه تنظیم نشده.

    اول با /setgif چند گیف اضافه کن.


cmd_clown_stickers_empty =
    😐 هنوز هیچ استیکر دلقکی برای این گروه تنظیم نشده.

    اول با /setsticker چند استیکر اضافه کن.


cmd_setunclowngif =
    🪄 گیف کاستوم برای دلقک‌برداری!

    اگه ادمین گروهی، همین دستور setunclowngif/ رو روی یک گیف ریپلای کن تا اون گیف به عنوان «دلقک‌بردار» ست بشه.
    📌 حداکثر ۳ گیف قابل تنظیم است.


cmd_setunclowngif_invalid =
    😐 ادمین دلقک‌برداری ندیده بودیم که دیدیم.

    یَره، موگوم روی «گیف» ریپلای کن. این چیه ریپلای کردی روش الان؟


cmd_setunclowngif_limit =
    😐 ظرفیت گیف‌ها پره!

    حداکثر ۳ گیف قابل تنظیمه. اول یکی رو با /removeunclowngif حذف کن.


cmd_setunclowngif_done =
    👀 گیف جدید برای دلقک‌برداری تنظیم شد. ({ $count } از { $max })


cmd_removeunclowngif_usage =
    🪄 حذف گیف دلقک‌بردار!

    روی یک گیف ریپلای کن و دستور /removeunclowngif رو بزن تا اون گیف حذف بشه.


cmd_removeunclowngif_invalid =
    😐 روی یک «گیف» ریپلای کن.


cmd_removeunclowngif_empty =
    😐 هیچ گیفی تنظیم نشده!

    اول با /setunclowngif یک گیف اضافه کن.


cmd_removeunclowngif_not_found =
    😐 این گیف در لیست گیف‌های تنظیم شده نیست.


cmd_removeunclowngif_done =
    👀 گیف از لیست حذف شد.


cmd_setunclownsticker =
    🪄 استیکر کاستوم برای دلقک‌برداری!

    اگه ادمین گروهی، همین دستور setunclownsticker/ رو روی یک استیکر ریپلای کن تا اون استیکر به عنوان «دلقک‌بردار» ست بشه.
    📌 حداکثر ۳ استیکر قابل تنظیم است.


cmd_setunclownsticker_invalid =
    😐 ادمین دلقک‌برداری ندیده بودیم که دیدیم.

    یَره، موگوم روی «استیکر» ریپلای کن. این چیه ریپلای کردی روش الان؟


cmd_setunclownsticker_limit =
    😐 ظرفیت استیکرها پره!

    حداکثر ۳ استیکر قابل تنظیمه. اول یکی رو با /removeunclownsticker حذف کن.


cmd_setunclownsticker_done =
    👀 استیکر جدید برای دلقک‌برداری تنظیم شد. ({ $count } از { $max })


cmd_removeunclownsticker_usage =
    🪄 حذف استیکر دلقک‌بردار!

    روی یک استیکر ریپلای کن و دستور /removeunclownsticker رو بزن تا اون استیکر حذف بشه.


cmd_removeunclownsticker_invalid =
    😐 روی یک «استیکر» ریپلای کن.


cmd_removeunclownsticker_empty =
    😐 هیچ استیکری تنظیم نشده!

    اول با /setunclownsticker یک استیکر اضافه کن.


cmd_removeunclownsticker_not_found =
    😐 این استیکر در لیست استیکرهای تنظیم شده نیست.


cmd_removeunclownsticker_done =
    👀 استیکر از لیست حذف شد.


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

help_admin_intro = مدیران گروه و مدیران تعیین‌شدهٔ بات می‌توانند این فرمان‌ها را در گروه اجرا کنند. ربات برای بررسی مدیران تلگرام باید اجازهٔ لازم را داشته باشد.

help_set_cooldown = /setcooldown <دقیقه> — تنظیم مهلت رأی از ۰ تا ۶۰ دقیقه؛ پیش‌فرض ۱۰.

help_reset_stats = /resetstats — شروع دورهٔ تازهٔ آمار؛ سابقهٔ رأی‌ها حذف نمی‌شود.

help_custom_clown_media = رسانهٔ دلقک‌کردن: روی گیف/انیمیشن ریپلای کنید و /setgif بفرستید؛ برای استیکر از /setsticker استفاده کنید. حذف: /removegif یا /removesticker. از هر نوع حداکثر ۳ مورد. همهٔ گیف‌ها را با /clowngifs و همهٔ استیکرها را با /clownstickers بفرستید.

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
    رسانه‌های ذخیره‌شده مربوط به نسخهٔ قدیمی هستند و شناسهٔ آن‌ها برای ارسال در تلگرام معتبر نیست.
    لطفاً روی هر GIF یا استیکر اصلی Reply کنید و دوباره دستور مناسب را بفرستید:
    /setgif، /setsticker، /setunclowngif یا /setunclownsticker.


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
