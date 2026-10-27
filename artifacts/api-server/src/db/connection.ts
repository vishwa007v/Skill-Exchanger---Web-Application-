/**
 * Single database connection entry point for the API server.
 *
 * The shared @workspace/db package owns the PostgreSQL pool and Drizzle
 * configuration. Keeping this import behind the backend db folder gives API
 * routes one stable place to import the application database from.
 */
import { db } from "@workspace/db";

export { db };
export type Database = typeof db;