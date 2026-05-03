const { Pool } = require("pg");
require("dotenv").config();

/**
 * PostgreSQL connection pool using Supabase credentials stored in .env
 * We use a connection pool for efficiency — it reuses existing connections
 * instead of creating a new one for every database request.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase pooler connections
  },
});

// Test the connection on startup so we know immediately if the DB is reachable
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Database connected successfully at:", res.rows[0].now);
  }
});

module.exports = pool;