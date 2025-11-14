import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema.js"

// Get connection string from environment
const connectionString = process.env.DATABASE_URL

// Validate connection string in production
if (!connectionString && process.env.NODE_ENV === "production") {
  console.error("❌ DATABASE_URL environment variable is required in production")
  process.exit(1)
}

const finalConnectionString =
  connectionString || "postgres://medflow_user:medflow_secure_password@localhost:5432/medflow_db"

// Create connection pool with optimized settings
export const pool = new Pool({
  connectionString: finalConnectionString,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  max: 20, // Maximum connections in pool
})

// Initialize Drizzle ORM with schema
export const db = drizzle(pool, { schema })

// Health check function
export async function checkConnection() {
  try {
    const result = await pool.query("SELECT NOW()")
    console.log("✅ Database connected successfully")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

export async function ensureSchema() {
  try {
    console.log("📦 Initializing database schema...")

    // Create necessary extensions and sequences
    await pool.query(`
			CREATE EXTENSION IF NOT EXISTS pgcrypto;
			CREATE SEQUENCE IF NOT EXISTS patients_mrn_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
		`)

    console.log("✅ Database schema initialized successfully")
    return true
  } catch (error) {
    console.error("❌ Schema initialization error:", error)
    return false
  }
}

// Close pool connection gracefully
export async function closeConnection() {
  try {
    await pool.end()
    console.log("✅ Database connection closed")
  } catch (error) {
    console.error("❌ Error closing connection:", error)
  }
}
