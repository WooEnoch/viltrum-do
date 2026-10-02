import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let sqlClient;
let database;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  if (!sqlClient) sqlClient = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  return sqlClient;
}

export function getDb() {
  if (!database) database = drizzle(getSql(), { schema });
  return database;
}
