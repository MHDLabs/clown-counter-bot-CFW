cmd_start = Welcome! I keep playful clown scores for your group. Add me to a group and reply to someone's message with /clown or 🤡 to vote. You can also reply with “clown” or 🤡 if I can see group messages. Change your language with /language. Privacy: /privacy | Source: /source
cmd_privacy = Privacy: I store only the group and user IDs/names needed for scores, vote times, group settings, custom media identifiers, and your selected language. I do not keep a message history. The source is available with /source.
cmd_source = Clown Counter is open source. Repository: https://github.com/MHDLabs/clown-counter-bot-CFW
cmd_language_prompt = Choose the language for your bot replies:
cmd_language_persian = فارسی
cmd_language_english = English
cmd_language_saved = Language preference saved.
cmd_clown_is_me = You cannot clown me; I am the bot!
cmd_clown_is_bot = That person is a bot, not a group member to vote on.
cmd_clown_is_you = You cannot vote for yourself!
cmd_clown_usage = Reply to a group member's message with /clown or 🤡 to cast a vote.
cmd_clown_wait = Please wait { $waitMin } more minute(s) before voting again.
cmd_clown = 🤡 { $clown } was clowned by { $voter }!
cmd_unclown_is_me = You cannot lower my clown score!
cmd_unclown_is_bot = That person is a bot, not a group member to vote on.
cmd_unclown_is_you = You cannot unclown yourself!
cmd_unclown_usage = Reply to a group member's message with /unclown or 😇 to lower their score.
cmd_unclown_wait = Please wait { $waitMin } more minute(s) before unclowning again.
cmd_unclown = 💀 { $voter } lowered { $clown }'s clown score!
cmd_stats_no_clown = No clown scores have been recorded in this group yet. Be the first! 🤡
cmd_stats_group = 🔥 Top clowns in this group
    { $clowns }{ $reset }
cmd_stats_group_clown = — { $name}: { $votes } vote(s)
cmd_stats_reset_at = 🕐 Statistics have been counted since { $date }.
cmd_clown_of_the_day_wait = Today's clown has already been chosen. Come back tomorrow! 🤡
cmd_clown_of_the_day_no_users = Nobody has been voted on in this group yet. Record a vote first, then try again.
cmd_clown_of_the_day = 👑 Clown of the day: { $clown } — { $quantity } clown votes!
cmd_setgif = Reply to a GIF with /setgif to add it as a clowning GIF. Up to 3 GIFs can be configured.
cmd_setgif_invalid = Reply to a GIF with this command.
cmd_setgif_limit = The GIF list is full. Remove one with /removegif first (maximum 3).
cmd_setgif_done = Clowning GIF added ({ $count } of { $max }).
cmd_removegif_usage = Reply to a configured GIF with /removegif to remove it.
cmd_removegif_invalid = Reply to a GIF with this command.
cmd_removegif_empty = No clowning GIFs are configured. Add one with /setgif.
cmd_removegif_not_found = That GIF is not in this group's configured list.
cmd_removegif_done = GIF removed.
cmd_setsticker = Reply to a sticker with /setsticker to add it as a clowning sticker. Up to 3 can be configured.
cmd_setsticker_invalid = Reply to a sticker with this command.
cmd_setsticker_limit = The sticker list is full. Remove one with /removesticker first (maximum 3).
cmd_setsticker_done = Clowning sticker added ({ $count } of { $max }).
cmd_removesticker_usage = Reply to a configured sticker with /removesticker to remove it.
cmd_removesticker_invalid = Reply to a sticker with this command.
cmd_removesticker_empty = No clowning stickers are configured. Add one with /setsticker.
cmd_removesticker_not_found = That sticker is not in this group's configured list.
cmd_removesticker_done = Sticker removed.
cmd_setunclowngif = Reply to a GIF with /setunclowngif to add it as an unclowning GIF. Up to 3 can be configured.
cmd_setunclowngif_invalid = Reply to a GIF with this command.
cmd_setunclowngif_limit = The unclowning GIF list is full. Remove one with /removeunclowngif first (maximum 3).
cmd_setunclowngif_done = Unclowning GIF added ({ $count } of { $max }).
cmd_removeunclowngif_usage = Reply to a configured GIF with /removeunclowngif to remove it.
cmd_removeunclowngif_invalid = Reply to a GIF with this command.
cmd_removeunclowngif_empty = No unclowning GIFs are configured. Add one with /setunclowngif.
cmd_removeunclowngif_not_found = That GIF is not in this group's configured list.
cmd_removeunclowngif_done = GIF removed.
cmd_setunclownsticker = Reply to a sticker with /setunclownsticker to add it as an unclowning sticker. Up to 3 can be configured.
cmd_setunclownsticker_invalid = Reply to a sticker with this command.
cmd_setunclownsticker_limit = The unclowning sticker list is full. Remove one with /removeunclownsticker first (maximum 3).
cmd_setunclownsticker_done = Unclowning sticker added ({ $count } of { $max }).
cmd_removeunclownsticker_usage = Reply to a configured sticker with /removeunclownsticker to remove it.
cmd_removeunclownsticker_invalid = Reply to a sticker with this command.
cmd_removeunclownsticker_empty = No unclowning stickers are configured. Add one with /setunclownsticker.
cmd_removeunclownsticker_not_found = That sticker is not in this group's configured list.
cmd_removeunclownsticker_done = Sticker removed.
cmd_setcooldown_usage = Set the voting cooldown in minutes. Usage: /setcooldown <minutes> (0–60; default 10).
cmd_setcooldown_invalid_number = Enter a whole number of minutes.
cmd_setcooldown_out_of_range = The cooldown must be between { $min } and { $max } minutes.
cmd_setcooldown_done = Voting cooldown set to { $minutes } minute(s).
cmd_resetstats_confirm = Reset this group's statistics from now onward? Existing votes will be kept, but excluded from the current totals.
cmd_resetstats_confirm_yes = Yes, reset
cmd_resetstats_confirm_no = No, cancel
cmd_resetstats_done = Group statistics have been reset. New votes will be counted from now.
cmd_resetstats_cancelled = Reset cancelled; statistics were not changed.
cmd_resetstats_not_admin = Only group administrators can reset statistics.
cmd_admin_only = Only group administrators can change this setting.

cmd_help =
    📖 Clown Counter — help

    VOTING (in a group)
    • Reply to a member's message with /clown or 🤡 to add a clown vote.
    • Reply with /unclown or 😇 to lower their score.
    • You cannot vote for yourself, the bot, or another bot. Each voter has a separate cooldown per group (default: 10 minutes).
    • You can also reply with 🤡 or «دلقک» / 😇 or «ستون» / «آدم عاقل». These plain-text triggers and custom media require the bot to receive group messages; Telegram privacy settings may require making the bot an administrator. Commands with replies work without reading every group message.

    GROUP COMMANDS
    • /stats — show this group's score table.
    • /clownoftheday — choose a random eligible clown once per UTC day; adds 5–20 votes.

    ADMIN COMMANDS (group admins; the bot must be able to verify admin status)
    • /setcooldown <minutes> — set the voting wait to 0–60 minutes (default 10).
    • /resetstats — start a new statistics period; stored vote history is kept.
    • Custom media: reply to an animation/GIF with /setgif or /setunclowngif; reply to a sticker with /setsticker or /setunclownsticker. Use the matching /remove... command the same way to remove it. Up to 3 items per type. To trigger configured media, send it as a reply to the member you want to vote for.

    PRIVATE CHAT
    • /language — save your reply language (English or فارسی).
    • /privacy — data storage details. /source — source code. /start — introduction.

    Votes and settings are separate for each group. Statistics reset does not delete vote records. For a vote, always reply to the target member's message.