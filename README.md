# Soft Hours

A hand-painted 3D memory room with a shared J & K noticeboard.

## Source

- `public/`: existing room assets, controls, modal UI and board frontend.
- `room.html`: root HTML returned by `app/route.ts` (keep its script/style references aligned with public/index.html).
- `app/api/board/route.ts`: authenticated shared board API.
- `db/schema.ts`, `drizzle/`: D1 schema and immutable migrations.

## Identity

Sites provides authenticated user headers. Configure runtime secrets BOARD_J_EMAIL and BOARD_K_EMAIL. On first authenticated use, an allowlisted email is bound to the stable site user ID and the unique J/K slot. Never add a browser-selectable identity. Grant the intended friend site access separately; without both the access grant and matching configured email, they cannot use the board. Do not expand the audience to publish.

## Development

Run the Sites dependency installer. For local preview, `.dev.vars` may contain BOARD_J_EMAIL=seedy@sites.test and BOARD_K_EMAIL=k@sites.test; this file is ignored. The standard local sign-in route supplies the J preview identity. Run `node scripts/run-framework.mjs dev --port 4173`. Apply migrations to local D1 as described in the Sites starter. Production and preview databases are separate; never copy local test data to production.

## Verification and build

`node tests/board-api.mjs` checks two-party access, author restrictions, cross-origin writes, idempotency, conflict detection, read receipts, archive and recovery using an isolated SQLite database.

`node scripts/run-framework.mjs build` creates the worker and client assets. Publish with Sites source workflow and deployment archive; migrations are carried in dist/.openai/drizzle.

The board polls every 4 seconds while open and checks unread state every 15 seconds while closed. Drafts are device-local; failed submissions are retained for manual retry. Photos use authenticated R2 original-file storage and D1 metadata; uploads are limited to 12 MB each and accept JPG, PNG and WebP. Removal is recoverable. Audio remains the earlier browser-only prototype.
