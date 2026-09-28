const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./users.db");

// Maak automatisch de users-tabel aan
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`);

// Registreren
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    const sql = `
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?)
    `;

    db.run(sql, [username, email, password], function (err) {
        if (err) {
            console.log(err.message);
            return res.send("Registration failed");
        }

        res.send("User registered successfully!");
    });
});

app.listen(PORT, () => {
    console.log(`Security Playground running on http://localhost:${PORT}`);
});