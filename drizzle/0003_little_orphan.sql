CREATE TABLE `letters` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`unlock_at` integer NOT NULL,
	`created` integer NOT NULL,
	`opened` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pillow_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presence` (
	`member` text PRIMARY KEY NOT NULL,
	`seen` integer NOT NULL
);
