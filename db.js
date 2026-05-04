const { Pool } = require("pg");
require("dotenv").config();

/**
 * PostgreSQL connection pool using the DATABASE_URL from .env
 * Uses Supabase Session Pooler with SSL enabled
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection on startup
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
    console.error("Ensure DATABASE_URL in .env is correct and the database is accessible.");
  } else {
    console.log("✅ Database connected successfully at:", res.rows[0].now);
  }
});

module.exports = pool;