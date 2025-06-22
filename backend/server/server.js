const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(express.json());

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS drawings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        data TEXT NOT NULL
    )`);
});

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.post('/api/drawings', (req, res) => {
    const { name, data } = req.body;
    if (!name || !data) {
        return res.status(400).json({ error: 'Missing name or data' });
    }
    const sql = `INSERT INTO drawings (name, data) VALUES (?, ?)`;
    db.run(sql, [name, data], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

app.get('/api/drawings', (req, res) => {
    const sql = `SELECT id, name FROM drawings`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ drawings: rows });
    });
});

app.get('/api/drawings/:id', (req, res) => {
    const sql = `SELECT data FROM drawings WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({ data: row.data });
        } else {
            res.status(404).json({ error: 'Drawing not found' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
