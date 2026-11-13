CREATE TABLE `clown_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voter_id` text,
	`clown_id` text NOT NULL,
	`group_id` text NOT NULL,
	`voted_at` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`voter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clown_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `clown_votes_group_voter_idx` ON `clown_votes` (`group_id`,`voter_id`,`voted_at`);--> statement-breakpoint
CREATE INDEX `clown_votes_group_idx` ON `clown_votes` (`group_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`gif_ids` text,
	`sticker_ids` text,
	`unclown_gif_ids` text,
	`unclown_sticker_ids` text,
	`reset_at` integer,
	`cooldown` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
