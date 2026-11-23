cmd_start = Welcome! I keep playful clown scores for your group. Add me to a group and reply to someone's message with /clown or 🤡 to vote. You can also reply with “clown” or 🤡 if I can see group messages. Change your language with /language. Privacy: /privacy | Source: /source

cmd_privacy = Privacy: I store only the group and user IDs/names needed for scores, vote times, group settings, custom media identifiers, and your selected language. Cooldown attempt counts have the same expiry as their cooldown and expired rows are cleaned up during later cooldown processing. I do not keep a message history. Configured bot administrators can privately view registered group names and current net clown scores; the panel does not show numeric member IDs, voters, or vote history. The source is available with /source.

cmd_source =
    ✨ The Clown Counter is an open-source project!

    This means you can access the full source code, run it on your own server, customize it, or even help improve it.

    🪄 Project repository:
    https://github.com/haashemi/clown-counter-bot


cmd_creator_credit = Project creator: { $creator } — owner ID: { $owner_id }

cmd_creator_channel = Creator channel

cmd_source_repository = View project source

cmd_language_prompt = Choose the language for your bot replies:

cmd_language_persian = فارسی

cmd_language_english = English

cmd_language_saved = Language preference saved.

cmd_clown_is_me = 🤖 I am the bot, not a valid clown-vote target!

cmd_clown_is_bot = That target is a bot. Pick a human group member instead.

cmd_clown_is_you = You cannot vote for yourself. Choose another member!

cmd_clown_usage = Reply to a group member's message with /clown or 🤡 to cast a vote.

cmd_clown_wait = Please wait { $waitMin } more minute(s) before voting again.

cmd_clown = 🤡 { $clown } was clowned by { $voter }!

cmd_clown_timeout_owner = You're the group owner and still this clowned? Imagine the rest of the group! 😏

cmd_clown_timeout_admin = I can't restrict a group admin; otherwise, you'd be sentenced to silence! 🤐

cmd_clown_timeout_no_access = I don't have permission to restrict you—otherwise, I'd zip it! 🙃

cmd_clown_timeout_muted = 🤐 That's enough! You can't send messages for { $waitMin } more minute(s).

cmd_unclown_is_me = You cannot lower the bot's clown score!

cmd_unclown_is_bot = That target is a bot, not a member eligible for votes.

cmd_unclown_is_you = You cannot unclown yourself!

cmd_unclown_usage = Reply to a group member's message with /unclown or 😇 to lower their score.

cmd_unclown_wait = ⏳ Wait { $waitMin } more minute(s) before your next reverse vote.

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

cmd_clown_gifs_empty = No clowning GIFs are configured in this group. Add some with /setgif.

cmd_clown_stickers_empty = No clowning stickers are configured in this group. Add some with /setsticker.

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




help_title = 🤡 Clown Counter — help

help_intro = Choose a button below to open a help section.

help_home_heading = What the bot can do

help_home_voting = Vote by replying to a member's group message.

help_home_group_stats = View the group leaderboard and clown of the day.

help_home_personal_stats = View your own or another member's score with /mystats.

help_home_settings = Manage cooldowns, statistics, and custom media.

help_home_footer = Find language, privacy, and source information under More.

help_button_home = 🏠 Help

help_button_voting = 🤡 Voting

help_button_group_stats = 📊 Group stats

help_button_personal_stats = 👤 Personal stats

help_button_admin = ⚙️ Settings

help_button_account = 🔒 More

help_voting_heading = Voting in a group

help_vote_add = Reply to a group member's message with /clown or 🤡 to add a clown vote.

help_vote_remove = Reply with /unclown or 😇 to lower their score.

help_vote_limits = You cannot vote for yourself, the bot, or another bot.

help_vote_cooldown = Each voter has a separate cooldown in each group (default: 10 minutes).

help_text_triggers = Text triggers are exact standalone words (extra spaces or ending punctuation are okay): 🤡 / clown / «دلقک» add a vote; 😇 / unclown / angel / «ستون» / «آدم عاقل» remove one. Configured media also trigger votes. These work only when Telegram delivers group messages to the bot; you may need to turn off Privacy Mode in BotFather or make the bot an administrator with limited rights. Reply commands do not require reading every group message.

help_vote_footer = Every vote must be sent as a reply to the target member's message.

help_group_heading = Group statistics

help_stats = /stats — show this group's score table.

help_clown_of_day = /clownoftheday — randomly choose the clown of the day once per Tehran calendar day and add 5–20 votes.

help_group_footer = Statistics and settings are separate for each group.

help_personal_heading = Personal stats in this group

help_personal_self = /mystats — view your current-period score, added points, and removed points in this group.

help_personal_reply = To view another member's stats, reply to one of their messages with /mystats.

help_personal_period = Stats start at the current period's reset time. /resetstats begins a new period.

help_admin_heading = Group settings

help_admin_intro = Group administrators and designated bot administrators can use these commands in groups. The bot must be able to check Telegram administrator status.

help_set_cooldown = /setcooldown minutes — set the vote cooldown to 0–60 minutes (default: 10).

help_reset_stats = /resetstats — start a new statistics period; stored vote history is kept.

help_custom_clown_media = Reply to a GIF/animation or sticker with /trigger, then choose whether it adds or removes a clown point. Use /triggers to list, remove, or clear saved media. Up to 3 GIFs and 3 stickers per action.

help_custom_unclown_media = The same /trigger command configures media for both clown and unclown actions. To use saved media, reply to the target member with the GIF or sticker.

help_private_heading = Private chat

help_language = /language — save your reply language (English or فارسی).

help_privacy_source = /privacy — data storage. /source — source code. /start — introduction.

help_footer = Use the buttons on this message to go back or open another section.

cmd_mystats_title = 📊 Current stats for { $name }

cmd_mystats_score = Net clown score: { $score }

cmd_mystats_received = Points added: { $received }

cmd_mystats_removed = Points removed: { $removed }

cmd_mystats_unavailable = I couldn't identify a user. Reply to a group member's message with this command.

cmd_clown_media_legacy =
    Some saved media use legacy identifiers that Telegram cannot send. Reply to each original GIF or sticker and add it again with /setgif, /setsticker, /setunclowngif, or /setunclownsticker.


cmd_clown_media_send_failed = 😕 Telegram could not send one or more saved media items. Re-add the affected media with the matching setup command.

# Owner-only bot status and group allowlist

admin_title = 🤡 Bot owner panel

admin_metric_groups = Registered groups: { $count }

admin_metric_active_groups = Confirmed active memberships: { $count }

admin_metric_clowns = Distinct members with a positive net clown score this period: { $count }

admin_metric_whitelist = Whitelist mode: { $mode } — allowlisted groups: { $count }

admin_whitelist_enabled = enabled

admin_whitelist_disabled = disabled

admin_groups_title = Known bot groups

admin_groups_empty = No groups are recorded yet. New group additions will be tracked automatically from now on.

admin_groups_note = Select a group to view its leaderboard or change its allowlist entry. Numeric IDs are not displayed. Telegram does not provide a list of older chats, so a group may remain unknown until the bot receives an update there.

admin_group_unnamed = Unnamed group

admin_group_active = Active member

admin_group_inactive = Not a member

admin_group_unknown = Unknown status

admin_group_line = { $name } — { $status } — whitelist: { $whitelist }

admin_group_membership = Bot membership: { $status }

admin_group_allowlist = Whitelist access: { $status }

admin_group_clowns_title = Current-period clowns by net score

admin_clown_line = { $name } — net score: { $score }

admin_group_no_clowns = No member has a positive net score in the current period.

admin_group_privacy_note = Only display names and net scores are shown; no IDs, voters, or vote timestamps are exposed.

admin_group_missing = This group is no longer present in the bot database.

admin_page = Page { $current } of { $total }

admin_button_groups = Group list

admin_button_home = Back to panel

admin_button_previous = Previous

admin_button_next = Next

admin_button_allow_group = Add to whitelist

admin_button_remove_group = Remove from whitelist

admin_button_enable_whitelist = Enable whitelist

admin_button_disable_whitelist = Disable whitelist

admin_button_creator_channel = Creator channel

admin_creator = Project creator: { $creator } — bot owner ID: { $owner_id }

admin_whitelist_needs_group = Add at least one group to the allowlist before enabling whitelist mode.

admin_group_not_active = Telegram confirms that the bot is no longer a member of this group. Re-add it before allowlisting.

admin_error = The panel could not be loaded. Please try again shortly.



cmd_stats_group_page = Page { $current } of { $total }

# Custom GIF/sticker triggers

cmd_trigger_usage =
    🪄 Reply to a GIF, animation, or sticker with /trigger to choose whether it adds or removes a clown point.
    📋 Use /triggers to list and remove saved media.
    📌 Up to { $max } per media type and action.

cmd_trigger_prompt =
    🪄 Configure this { $media ->
        [sticker] sticker
       *[animation] GIF
    }

    { $state ->
        [clown] Current action: 🤡 add a clown point
        [unclown] Current action: 😇 remove a clown point
       *[none] Current action: not configured
    }

cmd_triggers_empty = No custom GIFs or stickers have been configured in this group.

cmd_triggers_summary = Saved media: { $count }. Use the buttons on each item to remove it, or clear all.


trigger_media_animation = this GIF/animation

trigger_media_sticker = this sticker

trigger_state_clown = add a clown point

trigger_state_unclown = remove a clown point

trigger_state_unset = not configured

trigger_btn_clown = 🤡 Clown

trigger_btn_unclown = 😇 Unclown

trigger_btn_remove = Remove action

trigger_btn_delete = 🗑 Remove

trigger_btn_clear = Clear all

trigger_clear_yes = ✅ Clear

trigger_clear_no = Cancel

trigger_clear_confirm = Remove every saved GIF and sticker from this group?

trigger_cleared = All custom media triggers were removed.

trigger_clear_cancelled = Clear operation cancelled.

trigger_not_admin = Only group administrators can change custom media.

trigger_missing_media = The replied GIF or sticker is no longer available in this message.

trigger_limit = The limit is { $max } media items for this action and media type.

trigger_saved = Custom media action saved.

trigger_removed = Custom media action removed.

trigger_not_found = This saved media trigger could not be found.

trigger_stale_media = A saved { $media } could not be previewed. You can still remove it with the button.


# Public owner identity and whitelist notices

whitelist_group_disabled =
    🚫 The bot has been disabled in this group.

    Group whitelist mode is enabled, but this group is not on the allowlist. The bot will not process commands or group messages here. The bot owner can restore access by adding this group to the allowlist.

    Project creator: { $creator }
    Bot owner ID: { $owner_id }
    Creator channel: { $channel }
    Project source: { $repository }


whitelist_button_source = 🧩 Project source

whitelist_button_channel = 📢 Creator channel


trigger_gone = 😐 The replied GIF or sticker is no longer available. Run /trigger on it again.

triggers_btn_delete = { $action ->
        [unclown] 🗑 Remove (😇 Unclown)
       *[clown] 🗑 Remove (🤡 Clown)
    }

triggers_no_preview =
    { $media ->
        [sticker] 🎭 Sticker
       *[animation] 🎞 GIF
    } — old media without a preview.

triggers_btn_clear = 🧹 Clear all

triggers_clear_confirm = ⚠️ Remove every saved GIF and sticker from this group?

triggers_clear_yes = ✅ Yes, clear all

triggers_clear_no = ❌ Cancel

triggers_cleared = 🧹 All GIF and sticker triggers were removed.

triggers_clear_cancelled = No triggers were removed.

panel_close = ✖ Close
