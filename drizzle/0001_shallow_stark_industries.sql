CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`digest` text NOT NULL,
	`created` integer NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
