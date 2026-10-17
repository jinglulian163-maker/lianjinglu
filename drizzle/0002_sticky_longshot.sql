CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`memory` text NOT NULL,
	`day` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`cover_mime` text NOT NULL,
	`cover_size` integer NOT NULL,
	`digest` text NOT NULL,
	`created` integer NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL
);
