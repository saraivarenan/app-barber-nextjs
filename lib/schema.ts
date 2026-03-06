import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:         serial('id').primaryKey(),
  name:       text('name').notNull(),
  email:      text('email').notNull().unique(),
  password:   text('password').notNull(),
  isAdmin:    boolean('is_admin').notNull().default(false),
  isBlocked:  boolean('is_blocked').notNull().default(false),
  createdAt:  timestamp('created_at').defaultNow(),
})

export const contacts = pgTable('contacts', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  phone:     text('phone').default(''),
  createdAt: timestamp('created_at').defaultNow(),
})

export const schedules = pgTable('schedules', {
  id:         serial('id').primaryKey(),
  userId:     integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  client:     text('client').notNull(),
  phone:      text('phone').default(''),
  date:       text('date').notNull(),
  time:       text('time').notNull(),
  service:    text('service').notNull().default('Corte'),
  recurrence: text('recurrence').notNull().default('none'),
  recurDays:  text('recur_days').notNull().default('[]'),
  notes:      text('notes').default(''),
  createdAt:  timestamp('created_at').defaultNow(),
})

export type User     = typeof users.$inferSelect
export type Contact  = typeof contacts.$inferSelect
export type Schedule = typeof schedules.$inferSelect
