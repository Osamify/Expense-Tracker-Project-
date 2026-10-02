const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
app.use(express.json());
app.use(cors());
const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/api/expenses', async (req, res) => {
  try {

    const [expensesResult, summaryResult, highestResult] = await Promise.all([
      pool.query("SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date FROM expenses ORDER BY id"),
      pool.query("SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0)::float8 as total_amount FROM expenses"),
      pool.query("SELECT title, amount::float8, to_char(date, 'YYYY-MM-DD') as date FROM expenses ORDER BY amount DESC LIMIT 1")
    ]
    )


    res.status(200).json({
      expenses: expensesResult.rows,
      totalCount: parseInt(summaryResult.rows[0].total_count, 10),
      totalAmount: summaryResult.rows[0].total_amount,
      highestExpense: highestResult.rows[0] || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
})

app.get('/api/expenses/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await pool.query("SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date FROM expenses WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: "Title is required and cannot be empty" });
    }

    if (amount === undefined || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "A valid numeric amount is required and should be greater than 0" });
    }

    const allowedCategories = ['Bills', 'Transport', 'Food', 'Entertainment', 'Other'];

    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({ error: "Category is required and must be one of the allowed values" });
    }

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "A valid date format is required (e.g., YYYY-MM-DD)" });
    }

    const result = await pool.query("INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date",
      [title, amount, category, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
})

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, amount, category, date } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: "Title is required and cannot be empty" });
    }

    if (amount === undefined || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "A valid numeric amount is required and should be greater than 0" });
    }

    const allowedCategories = ['Housing', 'Transport', 'Food', 'Utilities', 'Entertainment'];

    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({ error: "Category is required and must be one of the allowed values" });
    }

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "A valid date format is required (e.g., YYYY-MM-DD)" });
    }

    const result = await pool.query("UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date",
      [title, amount, category, date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
})

app.delete('/api/expenses/:id', async (req, res) => {
  try {

    const id = req.params.id;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await pool.query("DELETE FROM expenses WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({ message: "Data successfully deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
})


app.listen(3000, () => {
  console.log("Server running on port 3000");
})