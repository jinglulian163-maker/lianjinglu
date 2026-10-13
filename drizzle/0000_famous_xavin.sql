CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`slot` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_slot_unique` ON `members` (`slot`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`pinned` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reads` (
	`note` text NOT NULL,
	`member` text NOT NULL,
	`version` integer NOT NULL,
	PRIMARY KEY(`note`, `member`),
	FOREIGN KEY (`note`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `replies` (
	`id` text PRIMARY KEY NOT NULL,
	`note` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`note`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
