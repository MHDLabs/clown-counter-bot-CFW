CREATE TABLE `clown_cooldown_attempts` (
	`group_id` text NOT NULL,
	`voter_id` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`group_id`, `voter_id`)
);
--> statement-breakpoint
CREATE INDEX `clown_cooldown_attempts_expires_at_idx` ON `clown_cooldown_attempts` (`expires_at`);