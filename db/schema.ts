// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const photos = sqliteTable('photos', {id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),digest:text('digest').notNull(),created:integer('created').notNull(),ready:integer('ready').notNull().default(0),deleted:integer('deleted').notNull().default(0)});
export const members = sqliteTable('members', { id: text('id').primaryKey(), slot: text('slot').notNull().unique() });
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(), author: text('author').notNull(), body: text('body').notNull(),
  created: integer('created').notNull(), updated: integer('updated').notNull(), version: integer('version').notNull().default(1),
  pinned: integer('pinned').notNull().default(0), archived: integer('archived').notNull().default(0), deleted: integer('deleted').notNull().default(0)
});
export const replies = sqliteTable('replies', { id: text('id').primaryKey(), note: text('note').notNull().references(()=>notes.id), author: text('author').notNull(), body: text('body').notNull(), created: integer('created').notNull() });
export const reads = sqliteTable('reads', { note: text('note').notNull().references(()=>notes.id), member: text('member').notNull(), version: integer('version').notNull() }, t => [primaryKey({columns:[t.note,t.member]})]);
export const records = sqliteTable('records', {id:text('id').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),memory:text('memory').notNull(),day:text('day').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),cover_mime:text('cover_mime').notNull(),cover_size:integer('cover_size').notNull(),digest:text('digest').notNull(),created:integer('created').notNull(),ready:integer('ready').notNull().default(0)});
export const presence = sqliteTable('presence',{member:text('member').primaryKey(),seen:integer('seen').notNull()});
export const letters = sqliteTable('letters',{id:text('id').primaryKey(),sender:text('sender').notNull(),recipient:text('recipient').notNull(),title:text('title').notNull(),body:text('body').notNull(),unlock_at:integer('unlock_at').notNull(),created:integer('created').notNull(),opened:integer('opened').notNull().default(0)});
export const pillow_notes = sqliteTable('pillow_notes',{id:text('id').primaryKey(),owner:text('owner').notNull(),body:text('body').notNull(),created:integer('created').notNull()});
