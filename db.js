const { Pool } = require("pg");
require("dotenv").config();

/**
 * PostgreSQL connection pool using Supabase credentials
 * We use a connection pool for efficiency — it reuses existing connections
 * instead of creating a new one for every database request.
 */
const pool = new Pool({
  host: "aws-1-eu-north-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.jwrhtesitguhwxiqdkcn",
  password: "Booknotes2025GH",
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