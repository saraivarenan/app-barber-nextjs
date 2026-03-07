import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export type DB = ReturnType<typeof drizzle<typeof schema>>

export function createDb(): DB {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não configurado')
  return drizzle(neon(url), { schema })
}
