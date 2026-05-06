const express = require("express");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("frontend/public"));

app.set("view engine", "ejs");
app.set("views", "./frontend/views");

// GET / - Display all books
app.get("/", async (req, res) => {
  const sortBy = req.query.sort || "date_read";
  const searchTerm = req.query.q ? req.query.q.trim() : "";
  const validSorts = ["rating", "date_read", "title"];
  const sortColumn = validSorts.includes(sortBy) ? sortBy : "date_read";

  try {
    let query = "SELECT * FROM books";
    const params = [];

    if (searchTerm) {
      query += " WHERE title ILIKE $1 OR author ILIKE $1";
      params.push(`%${searchTerm}%`);
    }

    query += ` ORDER BY ${sortColumn} DESC`;
    const result = await pool.query(query, params);

    res.render("index", {
      books: result.rows,
      currentSort: sortBy,
      currentSearch: searchTerm,
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).render("error", { message: "Failed to load books." });
  }
});

// GET /add - Show add form
app.get("/add", (req, res) => {
  res.render("add", { error: null });
});

// POST /add - Create book
app.post("/add", async (req, res) => {
  const { title, author, rating, notes, date_read, open_library_id } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).render("add", { error: "Title is required." });
  }

  try {
    await pool.query(
      "INSERT INTO books (title, author, rating, notes, date_read, open_library_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        title.trim(),
        author?.trim() || null,
        rating || null,
        notes?.trim() || null,
        date_read || null,
        open_library_id?.trim() || null,
      ]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).render("add", { error: "Could not save book." });
  }
});

// GET /edit/:id - Show edit form
app.get("/edit/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).render("error", { message: "Book not found." });
    }
    res.render("edit", { book: result.rows[0], error: null });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).render("error", { message: "Failed to load book." });
  }
});

// POST /edit/:id - Update book
app.post("/edit/:id", async (req, res) => {
  const { title, author, rating, notes, date_read, open_library_id } = req.body;

  if (!title || !title.trim()) {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
    return res.status(400).render("edit", {
      book: result.rows[0],
      error: "Title is required.",
    });
  }

  try {
    await pool.query(
      "UPDATE books SET title=$1, author=$2, rating=$3, notes=$4, date_read=$5, open_library_id=$6 WHERE id=$7",
      [
        title.trim(),
        author?.trim() || null,
        rating || null,
        notes?.trim() || null,
        date_read || null,
        open_library_id?.trim() || null,
        req.params.id,
      ]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).render("error", { message: "Could not update book." });
  }
});

// POST /delete/:id - Delete book
app.post("/delete/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.redirect("/");
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).render("error", { message: "Could not delete book." });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});