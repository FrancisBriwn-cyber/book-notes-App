const express = require("express");
const axios = require("axios");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3020;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true })); // Parse HTML form submissions
app.use(express.json());                          // Parse JSON request bodies
app.use(express.static("frontend/public"));       // Serve CSS, images, etc.

// Set EJS as the view/templating engine
app.set("view engine", "ejs");
app.set("views", "./frontend/views");

// ─── Allowed sort columns (whitelist to prevent SQL injection) ────────────────
const VALID_SORTS = ["rating", "date_read", "title"];

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /  — Home page: list all books with optional sorting
// ═══════════════════════════════════════════════════════════════════════════════
app.get("/", async (req, res) => {
  const sortBy = req.query.sort || "date_read"; // Default: most recently read
  const sortColumn = VALID_SORTS.includes(sortBy) ? sortBy : "date_read";

  try {
    const result = await pool.query(
      `SELECT * FROM books ORDER BY ${sortColumn} DESC`
    );
    res.render("index", { books: result.rows, currentSort: sortBy });
  } catch (err) {
    console.error("Error fetching books:", err.message);
    res.status(500).render("error", { message: "Could not load books. Please try again." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /add  — Render the "Add a Book" form
// ═══════════════════════════════════════════════════════════════════════════════
app.get("/add", (req, res) => {
  res.render("add", { error: null });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /add  — Save a new book to the database
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/add", async (req, res) => {
  const { title, author, rating, notes, date_read, open_library_id } = req.body;

  // Validate required fields
  if (!title || title.trim() === "") {
    return res.status(400).render("add", { error: "Book title is required." });
  }

  try {
    await pool.query(
      `INSERT INTO books (title, author, rating, notes, date_read, open_library_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        title.trim(),
        author ? author.trim() : null,
        rating || null,
        notes ? notes.trim() : null,
        date_read || null,
        open_library_id ? open_library_id.trim() : null,
      ]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err.message);
    res.status(500).render("add", { error: "Could not save book. Please try again." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /edit/:id  — Render the "Edit Book" form pre-filled with existing data
// ═══════════════════════════════════════════════════════════════════════════════
app.get("/edit/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM books WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).render("error", { message: "Book not found." });
    }

    res.render("edit", { book: result.rows[0], error: null });
  } catch (err) {
    console.error("Error fetching book for edit:", err.message);
    res.status(500).render("error", { message: "Could not load book." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /edit/:id  — Update an existing book in the database
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, rating, notes, date_read, open_library_id } = req.body;

  if (!title || title.trim() === "") {
    // Fetch the book again so the form can re-render with existing data
    const result = await pool.query(`SELECT * FROM books WHERE id = $1`, [id]);
    return res.status(400).render("edit", {
      book: result.rows[0],
      error: "Book title is required.",
    });
  }

  try {
    await pool.query(
      `UPDATE books
       SET title=$1, author=$2, rating=$3, notes=$4, date_read=$5, open_library_id=$6
       WHERE id=$7`,
      [
        title.trim(),
        author ? author.trim() : null,
        rating || null,
        notes ? notes.trim() : null,
        date_read || null,
        open_library_id ? open_library_id.trim() : null,
        id,
      ]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error updating book:", err.message);
    res.status(500).render("error", { message: "Could not update book." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /delete/:id  — Delete a book from the database
// ═══════════════════════════════════════════════════════════════════════════════
app.post("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM books WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).render("error", { message: "Book not found." });
    }

    res.redirect("/");
  } catch (err) {
    console.error("Error deleting book:", err.message);
    res.status(500).render("error", { message: "Could not delete book." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/search?q=  — Proxy to Open Library Search API
//  Used by the add-form to look up books and auto-fill the Open Library ID.
// ═══════════════════════════════════════════════════════════════════════════════
app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Query parameter `q` is required." });
  }

  try {
    // Open Library search API — returns title, author, and edition keys
    const response = await axios.get("https://openlibrary.org/search.json", {
      params: { q: q.trim(), limit: 8, fields: "title,author_name,cover_edition_key,key" },
    });

    // Shape the response to only expose what the frontend needs
    const books = response.data.docs.map((doc) => ({
      title: doc.title,
      author: doc.author_name ? doc.author_name[0] : "Unknown",
      open_library_id: doc.cover_edition_key || null,
      cover_url: doc.cover_edition_key
        ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-S.jpg`
        : null,
    }));

    res.json({ results: books });
  } catch (err) {
    console.error("Open Library API error:", err.message);
    res.status(502).json({ error: "Could not reach Open Library. Try again later." });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  404 catch-all — Any unmatched route
// ═══════════════════════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found." });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});