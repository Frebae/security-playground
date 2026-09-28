// ========================================
// 1. IMPORTS
// Loads the packages we need
// ========================================

const express = require("express");
const sqlite3 = require("sqlite3").verbose();


// ========================================
// 2. SERVER SETTINGS
// Creates the Express server
// ========================================

const app = express();
const PORT = 3000;


// ========================================
// 3. MIDDLEWARE
// Allows the server to read form data
// and JSON data
// ========================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ========================================
// 4. PUBLIC FOLDER
// Makes HTML and CSS files inside the
// "public" folder accessible
// ========================================

app.use(express.static("public"));


// ========================================
// 5. DATABASE CONNECTION
// Creates or opens the users.db database
// ========================================

const db = new sqlite3.Database("./users.db");


// ========================================
// 6. USERS TABLE
// Automatically creates the users table
// if it does not already exist
// ========================================

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`);


// ========================================
// 7. REGISTER ROUTE
// Receives data from register.html
// and stores the user in the database
// ========================================

app.post("/register", (req, res) => {

    // Get the submitted form data
    const { username, email, password } = req.body;


    // SQL query for adding a new user
    const sql = `
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?)
    `;


    // Run the SQL query
    db.run(sql, [username, email, password], function (err) {

        // If something goes wrong
        if (err) {
            console.log(err.message);
            return res.send("Registration failed");
        }


        // If registration is successful,
        // redirect the user back to the login page
        res.redirect("/");
    });
});


// ========================================
// 8. START SERVER
// Starts the website on localhost:3000
// ========================================

app.listen(PORT, () => {

    console.log(
        `Security Playground running on http://localhost:${PORT}`
    );

});