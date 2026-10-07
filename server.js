// ========================================
// IMPORTS
// ========================================

const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = 3000;


// ========================================
// POSTGRESQL DATABASE
// ========================================

const pool = new Pool({
    host: "192.168.56.101",
    port: 5432,
    user: "playground_user",
    password: "test123",
    database: "security_playground"
});


// ========================================
// MIDDLEWARE
// ========================================

// Read form data
app.use(express.urlencoded({ extended: true }));

// Read JSON data
app.use(express.json());

// Serve files from the public folder
app.use(express.static("public"));


// ========================================
// DATABASE CONNECTION TEST
// ========================================

pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL database.");
        client.release();
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });


// ========================================
// REGISTER
// ========================================

app.post("/register", async (req, res) => {

    const { username, email, password } = req.body;

    try {

        await pool.query(
            `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            `,
            [username, email, password]
        );

        console.log("User successfully registered:", email);

        // Go back to login page
        res.redirect("/");

    } catch (error) {

        console.error("Registration error:", error);

        if (error.code === "23505") {
            return res.send("An account with this email already exists.");
        }

        res.status(500).send("Something went wrong while creating your account.");
    }

});


// ========================================
// LOGIN
// ========================================

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM users
            WHERE email = $1
            AND password = $2
            `,
            [email, password]
        );

        // User found
        if (result.rows.length > 0) {

            const user = result.rows[0];

            console.log("Login successful:", user.username);

            // Go to Shinobi profile page
            return res.redirect("/profile.html");
        }

        // User not found
        console.log("Login failed:", email);

        res.send("Incorrect email or password.");

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).send("Something went wrong while logging in.");
    }

});


// ========================================
// PROFILE
// ========================================

// Temporary route
// Later we will save the profile information to PostgreSQL.

app.post("/profile", (req, res) => {

    console.log("Profile submitted:");
    console.log(req.body);

    res.send("Shinobi profile saved!");

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(`Security Playground running on http://localhost:${PORT}`);
    console.log("POST /register route is ready.");
    console.log("POST /login route is ready.");
    console.log("POST /profile route is ready.");

});