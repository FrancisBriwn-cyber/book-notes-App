# 📚 My Book Notes

A personal reading journal web app built with **Node.js**, **Express**, **EJS**, **PostgreSQL (Supabase)**, and the **Open Library Covers API**.

Inspired by [Derek Sivers' book notes](https://sive.rs/book) — log books you've read, write your notes, rate them, and sort by recency, rating, or title.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📖 Book list | Display all books with covers from the Open Library API |
| ➕ Add book | Log a new book with title, author, rating, date read, and personal notes |
| ✏️ Edit book | Update any book's details |
| 🗑 Delete book | Remove a book with a confirmation prompt |
| 🔍 Live search | Auto-search Open Library as you type a title to auto-fill fields |
| 🔃 Sort | Sort by rating, date read, or title |
| 🛡 SQL injection safe | Sort column is whitelisted server-side |
| 🌑 Dark mode UI | Premium dark-mode design |

---

## 🗂 Project Structure

```
book-notes/
├── index.js              ← Express server & all routes
├── db.js                 ← PostgreSQL connection pool (Supabase)
├── .env                  ← Environment variables (never commit!)
├── .gitignore
├── package.json
├── README.md
├── BookNotes.postman_collection.json  ← Postman collection for API testing
└── frontend/
    ├── public/
    │   └── styles.css    ← All styles (dark mode)
    └── views/
        ├── index.ejs     ← Home — book grid
        ├── add.ejs       ← Add a book form
        ├── edit.ejs      ← Edit a book form
        └── error.ejs     ← Error page
```

---

## 🚀 Getting Started

### 1. Clone or download the project

```bash
git clone <your-repo-url>
cd book-notes
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your `.env` file

Create a `.env` file in the project root (or edit the existing one):

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/postgres
PORT=3020
```

> 💡 Get your `DATABASE_URL` from your [Supabase](https://supabase.com) project → **Settings → Database → Connection string (URI)**.

### 4. Create the database table

Run this SQL in your Supabase SQL Editor (or any PostgreSQL client):

```sql
CREATE TABLE IF NOT EXISTS books (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255)  NOT NULL,
  author          VARCHAR(255),
  rating          INTEGER       CHECK (rating BETWEEN 1 AND 10),
  notes           TEXT,
  date_read       DATE,
  open_library_id VARCHAR(50),
  created_at      TIMESTAMP     DEFAULT NOW()
);
```

### 5. Start the development server

```bash
npm run dev
```

The server will start at **http://localhost:3020**

> To run without nodemon (production-style): `npm start`

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Home — list all books (supports `?sort=rating\|date_read\|title`) |
| `GET` | `/add` | Render the Add Book form |
| `POST` | `/add` | Save a new book to the database |
| `GET` | `/edit/:id` | Render the Edit Book form |
| `POST` | `/edit/:id` | Update a book in the database |
| `POST` | `/delete/:id` | Delete a book from the database |
| `GET` | `/api/search?q=` | Search Open Library for books (returns JSON) |

### `/api/search` example response

```json
{
  "results": [
    {
      "title": "Atomic Habits",
      "author": "James Clear",
      "open_library_id": "OL36183573M",
      "cover_url": "https://covers.openlibrary.org/b/olid/OL36183573M-S.jpg"
    }
  ]
}
```

---

## 🧪 Testing with Postman

A ready-to-import Postman collection is included: **`BookNotes.postman_collection.json`**

1. Open Postman
2. Click **Import**
3. Select `BookNotes.postman_collection.json`
4. All endpoints are pre-configured — just hit **Send**!

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `ejs` | HTML templating engine |
| `pg` | PostgreSQL client |
| `axios` | HTTP requests to Open Library API |
| `dotenv` | Load environment variables from `.env` |
| `nodemon` | Auto-restart server on file changes (dev) |

---

## 🌐 Open Library Covers API

Book covers are fetched from:
```
https://covers.openlibrary.org/b/olid/{OPEN_LIBRARY_ID}-M.jpg
```
Find a book's Open Library ID by searching at [openlibrary.org](https://openlibrary.org) and copying the ID from the URL (e.g. `/books/OL7353617M`).

---

## 🔒 Security Notes

- **Never commit your `.env` file** — it's listed in `.gitignore`
- Sort column is whitelisted server-side to prevent SQL injection
- Form inputs are validated before database writes
- Credentials are loaded via environment variables, not hardcoded

---

## 🤝 Credits

Inspired by [sive.rs/book](https://sive.rs/book) by Derek Sivers.
