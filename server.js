// ========================================
// 1. IMPORTS
// Loads Express and PostgreSQL
// ========================================

const express = require("express");
const { Pool } = require("pg");


// ========================================
// 2. SERVER SETTINGS
// Creates the Express application
// ========================================

const app = express();
const PORT = 3000;


// ========================================
// 3. MIDDLEWARE
// Allows Express to read HTML form data,
// JSON data and files from the public folder
// ========================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));


// ========================================
// 4. POSTGRESQL DATABASE CONNECTION
// Connects the website to PostgreSQL
// running inside the Ubuntu VirtualBox VM
// ========================================

const db = new Pool({

    host: "192.168.56.101",

    port: 5432,

    user: "playground_user",

    password: "test123",

    database: "security_playground"

});


// ========================================
// 5. TEST DATABASE CONNECTION
// Checks if Node.js can communicate
// with PostgreSQL
// ========================================

db.connect()
    .then((client) => {

        console.log("Connected to PostgreSQL database");

        client.release();

    })

    .catch((error) => {

        console.error("Database connection failed:");

        console.error(error.message);

    });


// ========================================
// 6. REGISTER ROUTE
// Receives data from register.html
// and saves the new user in PostgreSQL
// ========================================

app.post("/register", async (req, res) => {

    const { username, email, password } = req.body;


    // Show submitted data in the terminal
    // This helps us test the registration
    console.log("Registration attempt:");

    console.log("Username:", username);
    console.log("Email:", email);


    try {

        // SQL query
        const sql = `
            INSERT INTO users (
                username,
                email,
                password
            )
            VALUES ($1, $2, $3)
        `;


        // Send registration data to PostgreSQL
        await db.query(
            sql,
            [
                username,
                email,
                password
            ]
        );


        console.log("User successfully registered");


        // Return to login page
        res.redirect("/");

    }

    catch (error) {

        console.error(
            "Registration error:",
            error.message
        );


        res.send(
            "Registration failed: " +
            error.message
        );

    }

});

// ========================================
// 7. START SERVER
// Starts the website on localhost:3000
// ========================================

app.listen(PORT, () => {

    console.log(
        "Security Playground running on " +
        `http://localhost:${PORT}`
    );

    console.log(
        "POST /register route is ready"
    );

});