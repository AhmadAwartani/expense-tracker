require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;


// the columns we read every time. The date is turned into text 'YYYY-MM-DD'.

const COLUMNS = "id, title, amount, category, to_char(date, 'YYYY-MM-DD') AS date";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// try to connect once, so we see the problem (wrong password ...) when the server starts
pool.query("SELECT 1")
  .then(function () {
    console.log("Connected to PostgreSQL.");
  })
  .catch(function (error) {
    console.log("Could not connect to PostgreSQL: " + error.message);
  });

// ---------- middleware ----------

// CORS: the frontend and the backend are on different ports,
// so without this the browser blocks the requests
app.use(cors());

// turns the JSON body of the request into a normal JavaScript object (request.body)
app.use(express.json());

// if the body is not correct JSON, express.json() throws an error before our routes run.
// this middleware catches that one error and sends a clean 400 instead of crashing
app.use(function (error, request, response, next) {
  if (error.type === "entity.parse.failed") {
    response.status(400).json({ message: "Send the expense as JSON: title, amount, category and date." });
    return;
  }
  next(error);
});

// ---------- categories (dynamic, read from the database) ----------

// returns the names of every allowed category, in the order they were added.
// NOTE: this used to be a hardcoded array in the code. Now the list lives only
// in the database, in the categories table - that is what makes it "dynamic".
async function getAllowedCategories() {
  const result = await pool.query("SELECT name FROM categories ORDER BY id");
  return result.rows.map(function (row) {
    return row.name;
  });
}

// GET /api/categories -> every category name (200)
app.get("/api/categories", async function (request, response) {
  try {
    const categories = await getAllowedCategories();
    response.status(200).json(categories);
  } catch (error) {
    console.log("Error: " + error.message);
    response.status(500).json({ message: "Something went wrong in the server. Please try again." });
  }
});

// ---------- small helper functions ----------

// the id comes from the URL as text, so we check it before we use it (for example /abc)
function isValidId(text) {
  const id = Number(text);
  return Number.isInteger(id) && id > 0;
}

// ADVANCED (outside the course): checks that a text is a real date in the exact
// format YYYY-MM-DD (for example 2026-02-30 is the right format, but not a real day)
function isValidDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// works out the final category to save.
//
// allowNewCategory is true only for POST (adding a new expense). When the user
// picked "Other" and typed a new category name, we add that name to the
// categories table (if it is not already there) and use it instead of "Other".
//
// allowNewCategory is false for PUT (editing), so editing an old expense that
// is already saved as "Other" still works normally, with no text box involved.
async function resolveCategory(body, allowNewCategory) {
  if (allowNewCategory && body.category === "Other") {
    const newCategory = typeof body.otherCategory === "string" ? body.otherCategory.trim() : "";

    if (newCategory === "") {
      return { problem: "Please type a name for the new category." };
    }
    if (newCategory.length > 20) {
      return { problem: "The new category must be 20 characters or less." };
    }

    // ON CONFLICT DO NOTHING: if the user types a category that already exists
    // (for example "Food" again), we just reuse it instead of failing
    await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [newCategory]);
    return { category: newCategory };
  }

  const allowedCategories = await getAllowedCategories();
  if (!allowedCategories.includes(body.category)) {
    return { problem: "Category must be one of: " + allowedCategories.join(", ") + "." };
  }
  return { category: body.category };
}

// checks the whole expense (title, amount, category, date).
// returns { problem: "..." } when something is wrong, or { expense: {...} } when it is fine
async function validateExpense(body, allowNewCategory) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title === "") {
    return { problem: "Title is required." };
  }
  if (title.length > 100) {
    return { problem: "Title must be 100 characters or less." };
  }

  const amount = Number(body.amount);
  if (body.amount === undefined || body.amount === null || isNaN(amount)) {
    return { problem: "Amount is required and it must be a number." };
  }
  if (amount <= 0) {
    return { problem: "Amount must be a number greater than 0." };
  }
  if (amount > 99999999.99) {
    return { problem: "Amount is too big. The maximum is 99999999.99" };
  }
  if (Math.round(amount * 100) / 100 !== amount) {
    return { problem: "Amount can have at most 2 decimal places." };
  }

  const categoryResult = await resolveCategory(body, allowNewCategory);
  if (categoryResult.problem) {
    return { problem: categoryResult.problem };
  }

  if (!isValidDate(body.date)) {
    return { problem: "Date must be a real date in this format: YYYY-MM-DD." };
  }

  return {
    expense: {
      title: title,
      amount: amount,
      category: categoryResult.category,
      date: body.date
    }
  };
}

// pg gives NUMERIC columns back as text (so big numbers never lose precision).
// The frontend expects a real number (it calls expense.amount.toFixed(2)), so we convert it here.
function rowToExpense(row) {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    date: row.date
  };
}

// ---------- the 5 endpoints ----------

// GET /api/expenses -> all the expenses (200)
app.get("/api/expenses", async function (request, response) {
  try {
    const result = await pool.query("SELECT " + COLUMNS + " FROM expenses ORDER BY date DESC, id DESC");
    response.status(200).json(result.rows.map(rowToExpense));
  } catch (error) {
    console.log("Error: " + error.message);
    response.status(500).json({ message: "Something went wrong in the server. Please try again." });
  }
});

// GET /api/expenses/5 -> one expense (200), or 404
app.get("/api/expenses/:id", async function (request, response) {
  try {
    if (!isValidId(request.params.id)) {
      response.status(404).json({ message: "Expense not found." });
      return;
    }

    const result = await pool.query(
      "SELECT " + COLUMNS + " FROM expenses WHERE id = $1",
      [request.params.id]
    );

    if (result.rows.length === 0) {
      response.status(404).json({ message: "Expense not found." });
      return;
    }

    response.status(200).json(rowToExpense(result.rows[0]));
  } catch (error) {
    console.log("Error: " + error.message);
    response.status(500).json({ message: "Something went wrong in the server. Please try again." });
  }
});

// POST /api/expenses -> adds an expense (201), or 400 if the data is wrong
app.post("/api/expenses", async function (request, response) {
  try {
    const result = await validateExpense(request.body, true);
    if (result.problem) {
      response.status(400).json({ message: result.problem });
      return;
    }

    const expense = result.expense;
    const inserted = await pool.query(
      "INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING " + COLUMNS,
      [expense.title, expense.amount, expense.category, expense.date]
    );

    response.status(201).json(rowToExpense(inserted.rows[0]));
  } catch (error) {
    console.log("Error: " + error.message);
    response.status(500).json({ message: "Something went wrong in the server. Please try again." });
  }
});

// PUT /api/expenses/5 -> updates an expense (200), or 400, or 404
app.put("/api/expenses/:id", async function (request, response) {
  try {
    if (!isValidId(request.params.id)) {
      response.status(404).json({ message: "Expense not found." });
      return;
    }

  const result = await validateExpense(request.body, false);
    if (result.problem) {
      response.status(400).json({ message: result.problem });
      return;
    }

    const expense = result.expense;
    const updated = await pool.query(
      "UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING " + COLUMNS,
      [expense.title, expense.amount, expense.category, expense.date, request.params.id]
    );

    if (updated.rows.length === 0) {
      response.status(404).json({ message: "Expense not found." });
      return;
    }

    response.status(200).json(rowToExpense(updated.rows[0]));
  } catch (error) {
    console.log("Error: " + error.message);
    response.status(500).json({ message: "Something went wrong in the server. Please try again." });
  }
});

// DELETE /api/expenses/5 -> deletes an expense (200), or 404
app.delete("/api/expenses/:id", async function (request, response) {
  try {
    if (!isValidId(request.params.id)) {
      response.status(404).json({ message: "Expense not found." });
      return;
    }

    const result = await pool.query("DELETE FROM expenses WHERE id = $1", [request.params.id]);

    if (result.rowCount === 0) {
      response.status(404).json({ message: "Expense not found." });
      return;
    }

    response.status(200).json({ message: "Expense deleted." });
  } catch (error) {
    console.log("Error: " + error.message);
    response.status(500).json({ message: "Something went wrong in the server. Please try again." });
  }
});

// any address that is not one of the 5 endpoints above
app.use(function (request, response) {
  response.status(404).json({ message: "Address not found." });
});

// ---------- start listening ----------

app.listen(PORT, function () {
  console.log("Server is running on http://localhost:" + PORT + "  (press Ctrl+C to stop)");
});
