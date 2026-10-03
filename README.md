# Expense Tracker

GitHub repository: https://github.com/AhmadAwartani/expense-tracker.git

A web app to track my personal expenses. I can add an expense (title, amount, category, date), see all of them in a table, filter by category, edit, delete, and see the total, the number of expenses and the highest expense.

I built it for the Full Stack course at Dalil Training Academy, using:

- HTML, CSS, Bootstrap 5 and JavaScript (frontend)
- Node.js, Express and the pg library (backend)
- PostgreSQL with pgAdmin 4 (database)

## Features 

- Add, edit (in a Bootstrap modal) and delete expenses
- Filter the table by category (or "All")
- 3 summary cards (total, count, highest). They always count all the expenses, not only the filtered ones
- Validation for every field, in the browser and again in the Express server
- Spinner while loading, and clear alerts for errors (also when the server is off)
- Dark mode and light mode
- English and Arabic (the page becomes right-to-left in Arabic)
- Responsive: works on a phone screen
- Choose "Other" when adding an expense to type your own category. It shows in the category list and in the filter as long as at least one expense uses it

## How to run the project from zero

You need: Node.js (LTS version), PostgreSQL + pgAdmin 4, and VS Code with the Live Server extension.

### 1. The database

1. Open pgAdmin 4 and create an empty database named `expense_tracker`.
2. Open the Query Tool on it, open the file `backend/schema.sql` and run it. It creates the `expenses` table and some sample data.

### 2. The backend (Node.js + Express)

1. Go to the `backend` folder in a terminal.
2. Install the packages:

```
npm install
```

3. Copy `.env.example` to a new file named `.env`, and write your own PostgreSQL password (and other settings if they are different on your machine).
4. Start the server:

```
npm start
```

5. You should see `Connected to PostgreSQL.` and `Server is running on http://localhost:3000`. Keep this terminal open.

### 3. The frontend

Open the `frontend` folder in VS Code, right click on `index.html` and choose **Open with Live Server**.

## The API

| Method | Path | What it does | Success | Errors |
|--------|------|--------------|---------|--------|
| GET | /api/expenses | all the expenses | 200 | - |
| GET | /api/categories | all the categories | 200 | - |
| GET | /api/expenses/:id | one expense | 200 | 404 |
| GET | /api/categories/:id | one categories | 200 | 404 |
| POST | /api/expenses | add an expense | 201 | 400 |
| PUT | /api/expenses/:id | update an expense | 200 | 400, 404 |
| DELETE | /api/expenses/:id | delete an expense | 200 | 404 |

An expense looks like this:

```json
{ "id": 1, "title": "Lunch", "amount": 4.5, "category": "Food", "date": "2026-01-15" }
```

Allowed categories: Food, Transport, Bills, Entertainment, Other.

## Project structure

```
Expense-tracker/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js            (the logic of the page)
│       └── translations.js   (English and Arabic texts)
├── backend/
│   ├── server.js              (the whole API: routes, validation, and the SQL)
│   ├── package.json
│   ├── .env.example
│   └── schema.sql
└── README.md
```


## Sortable table feature:
 click the arrow next to Title, Amount, Category, or Date to sort the table by that column, ascending or descending — a bonus feature I added beyond the roadmap's requirements.


## The hardest thing I faced and how I solved it

I first built the backend in C# instead of Node.js/Express. It worked, but it did not match what the course asked me to learn in Phase 0 (Node, Express, and the pg library), so I rebuilt the backend in Node.js and Express, keeping the same 5 endpoints, the same validation rules, and the same database. The frontend did not need any changes at all, because it only talks to the API through fetch and does not know (or care) what language answers it — that is the whole point of separating the frontend and the backend.